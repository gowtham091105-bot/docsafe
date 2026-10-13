const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src');

fs.writeFileSync(path.join(srcPath, 'core/auth/auth.module.ts'), `
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: 'SECRET_KEY_DOCSAFE',
      signOptions: { expiresIn: '1d' },
    })
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
`);

console.log('AuthModule updated.');
