import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';

import { Like, Not, Raw, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt'

import { User } from './entities/user.entity';
import { CreateUserDto, LoginUserDto, UpdateUserDto } from './dto';

import { CommonService } from 'src/common/common.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UserRoles } from './enums';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UpdateRoleDto } from './dto/updateRole.dto';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly commonService : CommonService,

    private readonly jwtService: JwtService
   ) {} 

   async register(createUserDto: CreateUserDto) {
    try {
        const { contraseña, ...userData } = createUserDto;
        // Verificar si la contraseña está definida
        if (!contraseña) {
            throw new BadRequestException('La contraseña es obligatoria');
        }
        // Generar el salt con un número de rondas (por ejemplo, 10)
        const salt = await bcrypt.genSalt(10);
        // Hash de la contraseña con el salt
        const hashedPassword = await bcrypt.hash(contraseña, salt);

        const user = this.userRepository.create({
            ...userData,
            contraseña: hashedPassword
        });

        await this.userRepository.save(user);

        return {
            status: 201,
            message: 'Usuario creado con éxito',
            user: { id: user.id, nombre: user.nombre, email: user.email },
            token: this.getJwtToken({ id: user.id })
        };
    } catch (error) {
        return this.commonService.handleDBExceptions(error);
    }
}

   async login(loginUserDto: LoginUserDto){

    try {
        const { email, contraseña } = loginUserDto;

        const user = await this.userRepository.findOne({
            where: { email }
        })

        if(!user){
            throw new UnauthorizedException('Credenciales incorrectas(email)')
        }
        if(!bcrypt.compareSync(contraseña, user.contraseña)){
            throw new UnauthorizedException('Credenciales incorrectas(contraseña)')
        }

        return {
            code: 200,
            message: "inicio de sesion exitoso",
            ...user,
            token: this.getJwtToken({
                id: user.id,
                nombre: user.nombre,
                rol: user.rol,
            })
        }

    } catch (error) {
        throw error
    }
   }

   async update(id: number, updateRoleDto: UpdateRoleDto) {
    try {
        const user = await this.userRepository.preload({
            id,
            ...updateRoleDto // Esto solo actualizará el campo rol
        });

        if (!user) {
            throw new BadRequestException('Usuario no encontrado');
        }

        await this.userRepository.save(user);

        return {
            status: 200,
            message: 'Usuario actualizado con éxito',
            ...user,
        };
    } catch (error) {
        throw error;
    }
}

   async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;

    const whereClause = {
        rol: Raw(alias => `NOT ('admin' = ANY(${alias}))`), // Excluir admin
    };

    const totalUsers = await this.userRepository.count({ where: whereClause });
    const totalPages = Math.ceil(totalUsers / limit);

    const data = await this.userRepository.find({
        skip: (page - 1) * limit,
        take: limit,
        where: whereClause,
        order: { nombre: "ASC" } // Orden por defecto ascendente
    });

    return {
        data,
        meta: {
            totalUsers,
            totalPages,
            page
        }
    };
}

    async findOne(id: number){
        try {
            const user = await this.userRepository.findOne( {where: {id}} )
            if(!user) 
                throw new BadRequestException('Usuario no encontrado')

            return user

        } catch (error) {
            throw error
        }
    }

    private getJwtToken ( payload : JwtPayload ){
        const token = this.jwtService.sign( payload )
        return token
      }

    async searchByName(name: string){
        try {
            const user = await this.userRepository.findOne({
                where: { nombre: name }
            })
            if(!user){
                throw new BadRequestException('Usuario no encontrado')
            }
            return user
        } catch (error) {
            throw error
        }
    }  
}
