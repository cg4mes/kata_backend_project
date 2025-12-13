import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from './users.entity';
import {
  CreateUserDto,
  LoginDto,
  UserResponseDto,
  LoginResponseDto,
  UpdateUserRoleDto,
} from './dto/users.dto';
import { BCRYPT_SALT_ROUNDS, ERROR_MESSAGES } from '../common/constants';

/**
 * Service responsible for user management and authentication
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
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

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || UserRole.VIEWER,
    });

    const savedUser = await this.usersRepository.save(user);
    this.logger.log(`User created: ${savedUser.email}`);
    return this.toUserResponse(savedUser);
  }

  /**
   * Authenticates a user and returns JWT token
   * @param loginDto - Login credentials
   * @returns LoginResponseDto with access token and user info
   * @throws UnauthorizedException if credentials are invalid
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

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
    const users = await this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });
    return users.map((user) => this.toUserResponse(user));
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
    user.role = updateUserRoleDto.role;
    const updatedUser = await this.usersRepository.save(user);
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
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    this.logger.log(`User deleted: ${id}`);
  }

  /**
   * Finds a user by ID (for internal use)
   * @param id - User ID
   * @returns User entity or null
   */
  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  // Private helper methods

  /**
   * Validates that email and username are unique
   */
  private async validateUniqueUser(
    email: string,
    username: string,
  ): Promise<void> {
    const existingUser = await this.usersRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException(ERROR_MESSAGES.USER_EMAIL_EXISTS);
      }
      throw new ConflictException(ERROR_MESSAGES.USER_USERNAME_EXISTS);
    }
  }

  /**
   * Finds user by ID and throws if not found
   */
  private async findUserById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
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
  private async generateToken(user: User): Promise<string> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.signAsync(payload);
  }

  /**
   * Converts User entity to UserResponseDto (excluding password)
   */
  private toUserResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
