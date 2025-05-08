import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/infrastracture/prisma/prisma.service';
import { report } from 'process';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: any) => request?.cookies?.['H2-Access-Token'],
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: { userId: string; email: string; walletId: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        organization: true,
        session: true
      },
    });
  
    if (!user) {
      throw new Error('User not found');
    }
  
    return user;
  }
}
