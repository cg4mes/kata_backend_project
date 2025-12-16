import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from './users.entity';
import {
  CreateUserDto,
  LoginDto,
  UserResponseDto,
  LoginResponseDto,
  UpdateUserRoleDto,
} from './dto/users.dto';
import { BCRYPT_SALT_ROUNDS, ERROR_MESSAGES } from '../common/constants';
import { DynamoDBDatasource } from '../common/datasources/dynamodb.datasource';

/**
 * Service responsible for user management and authentication using DynamoDB
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly dynamodb: DynamoDBDatasource,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Creates a new user
   * @param createUserDto - User data for creation
   * @returns UserResponseDto without password
   * @throws ConflictException if email or username already exists
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    await this.validateUniqueUser(createUserDto.email, createUserDto.username);

    const hashedPassword = await this.hashPassword(createUserDto.password);
    const id = uuidv4();
    const now = new Date().toISOString();

    const userItem = {
      PK: `USER#${createUserDto.username}`,
      SK: 'METADATA',
      EntityType: 'User',
      id,
      username: createUserDto.username,
      email: createUserDto.email,
      password: hashedPassword,
      role: createUserDto.role || UserRole.VIEWER,
      createdAt: now,
      updatedAt: now,
      // GSI1 for email lookup
      GSI1PK: `EMAIL#${createUserDto.email}`,
      GSI1SK: `USER#${createUserDto.username}`,
    };

    await this.dynamodb.put(userItem);
    this.logger.log(`User created: ${createUserDto.email}`);
    return this.toUserResponse(userItem);
  }

  /**
   * Authenticates a user and returns JWT token
   * @param loginDto - Login credentials
   * @returns LoginResponseDto with access token and user info
   * @throws UnauthorizedException if credentials are invalid
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    // Query by email using GSI1
    const users = await this.dynamodb.queryGSI(
      'GSI1',
      `EMAIL#${loginDto.email}`,
    );

    if (!users || users.length === 0) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const user = users[0];
    const isPasswordValid = await this.validatePassword(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const access_token = await this.generateToken(user);
    this.logger.log(`User logged in: ${user.email}`);

    return {
      access_token,
      user: this.toUserResponse(user),
    };
  }

  /**
   * Retrieves all users
   * @returns Array of UserResponseDto
   */
  async findAll(): Promise<UserResponseDto[]> {
    // Scan all users with filter (optimized with pagination for large datasets)
    const items = await this.dynamodb.scan({
      filter: 'EntityType = :type AND SK = :sk',
      filterValues: { ':type': 'User', ':sk': 'METADATA' },
    });

    return items.map((user) => this.toUserResponse(user));
  }

  /**
   * Retrieves a single user by ID
   * @param id - User ID
   * @returns UserResponseDto
   * @throws NotFoundException if user doesn't exist
   */
  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.findUserById(id);
    return this.toUserResponse(user);
  }

  /**
   * Updates user role
   * @param id - User ID
   * @param updateUserRoleDto - New role data
   * @returns Updated UserResponseDto
   * @throws NotFoundException if user doesn't exist
   */
  async updateRole(
    id: string,
    updateUserRoleDto: UpdateUserRoleDto,
  ): Promise<UserResponseDto> {
    const user = await this.findUserById(id);

    const updatedUser = await this.dynamodb.update(
      user.PK,
      user.SK,
      {
        role: updateUserRoleDto.role,
        updatedAt: new Date().toISOString(),
      },
      true,
    );

    this.logger.log(
      `User role updated: ${user.email} -> ${updateUserRoleDto.role}`,
    );
    return this.toUserResponse(updatedUser);
  }

  /**
   * Removes a user
   * @param id - User ID
   * @throws NotFoundException if user doesn't exist
   */
  async remove(id: string): Promise<void> {
    const user = await this.findUserById(id);
    await this.dynamodb.delete(user.PK, user.SK);
    this.logger.log(`User deleted: ${id}`);
  }

  /**
   * Finds a user by ID (for internal use)
   * @param id - User ID
   * @returns User entity or null
   */
  async findById(id: string): Promise<any | null> {
    // Scan to find by ID since username is PK
    // For better performance in production, consider adding GSI for id lookup
    const items = await this.dynamodb.scan({
      filter: 'id = :id AND EntityType = :type',
      filterValues: { ':id': id, ':type': 'User' },
    });
    return items.length > 0 ? items[0] : null;
  }

  // Private helper methods

  /**
   * Validates that email and username are unique
   */
  private async validateUniqueUser(
    email: string,
    username: string,
  ): Promise<void> {
    // Check username (PK)
    const userByUsername = await this.dynamodb.get(
      `USER#${username}`,
      'METADATA',
    );
    if (userByUsername) {
      throw new ConflictException(ERROR_MESSAGES.USER_USERNAME_EXISTS);
    }

    // Check email (GSI1)
    const usersByEmail = await this.dynamodb.queryGSI('GSI1', `EMAIL#${email}`);
    if (usersByEmail && usersByEmail.length > 0) {
      throw new ConflictException(ERROR_MESSAGES.USER_EMAIL_EXISTS);
    }
  }

  /**
   * Finds user by ID and throws if not found
   */
  private async findUserById(id: string): Promise<any> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    return user;
  }

  /**
   * Hashes a password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  /**
   * Validates password against hash
   */
  private async validatePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generates JWT token for user
   */
  private async generateToken(user: any): Promise<string> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.signAsync(payload);
  }

  /**
   * Converts User item to UserResponseDto (excluding password)
   */
  private toUserResponse(user: any): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
