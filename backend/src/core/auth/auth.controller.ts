import { Controller, Post, Get, Body, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  async login(@Body() body: any) {
    const data = await this.authService.login(body.email, body.password);
    return { success: true, message: 'Logged in successfully', data };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: any) {
    return { success: true, message: 'Current user profile', data: req.user };
  }

  @UseGuards(JwtAuthGuard)
  @Get('users')
  async getUsers(@Request() req: any) {
    const data = await this.usersService.findAll(req.user.tenantId);
    return { success: true, message: 'Users fetched successfully', data };
  }
}
