import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,

} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
  HttpErrors,
  RestBindings,
  Response,
  Request
} from '@loopback/rest';
import {inject} from '@loopback/core';
import { authenticate } from '@loopback/authentication';
import * as jwt from 'jsonwebtoken';
import {User} from '../models';
import {UserRepository} from '../repositories';
import * as bcrypt from 'bcryptjs';
export class UserController {
  constructor(
    @repository(UserRepository)
    public userRepository : UserRepository,
  ) {}

  //create
  @post('/users')
  @response(200, {
    description: 'User model instance',
    content: {'application/json': {schema: getModelSchemaRef(User)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {
            title: 'NewUser',
            exclude: ['id'],
          }),
        },
      },
    })
    user: Omit<User, 'id'>,
  ): Promise<User> {
    // ── Duplicate email check ─────────────────────────────────────────────
    const existing = await this.userRepository.findOne({
      where: {email: user.email},
    });
    if (existing) {
      throw new HttpErrors.Conflict('An account with this email already exists');
    }

    // ── Password strength validation ──────────────────────────────────────
    const pw = user.password;
    if (!pw || pw.length < 8) {
      throw new HttpErrors.UnprocessableEntity('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(pw)) {
      throw new HttpErrors.UnprocessableEntity('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(pw)) {
      throw new HttpErrors.UnprocessableEntity('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(pw)) {
      throw new HttpErrors.UnprocessableEntity('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) {
      throw new HttpErrors.UnprocessableEntity('Password must contain at least one special character (!@#$%^&*…)');
    }

    const saltRounds = 10;
    user.password = await bcrypt.hash(user.password, saltRounds);
    return this.userRepository.create(user);
  }


  //login
  @post('/users/login')
  @response(200,{
    description:'Login',
  })
  async login(
    @requestBody({
      content:{
        'application/json':{
          schema:{
            type:'object',
            properties:{
              email:{type:'string'},
              password:{type:'string'},
            },
          },
        },
      },
    })
    credentials:{email:string;password:string},
    @inject(RestBindings.Http.RESPONSE) res: Response,
  ): Promise<{message: string; token: string; user: {id: number; email: string; name: string}}>{
    const user=await this.userRepository.findOne({
      where:{email:credentials.email},
    });
    if(!user){
      throw new HttpErrors.Unauthorized('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(credentials.password, user.password);
    if (!isMatch) {
      throw new HttpErrors.Unauthorized('Invalid credentials');
    }


    const token = jwt.sign(
      { id: user.id, email: user.email,name: user.name },
      process.env.JWT_SECRET ?? 'secret',
      { expiresIn: '1d' },
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      message: 'Login successful',
      token,
      user: { id: user.id ?? 0, email: user.email, name: user.name },
    };
  }

  //logout
  @post('/users/logout')
  @response(200, {
    description: 'Logout',
  })
  async logout(
    @inject(RestBindings.Http.RESPONSE) res: Response,
  ): Promise<{message: string}> {
    
    // ✅ Cookie clear karo
    res.clearCookie('token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
  
    return { message: 'Logout successful' };
  }
  
  //authentication
  @get('/users/me')
  @response(200, {description: 'Current user'})
  async me(
    @inject(RestBindings.Http.REQUEST) req: Request,
  ): Promise<object> {
    const token = req.cookies?.token;
    if (!token) throw new HttpErrors.Unauthorized();
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? 'secret') as jwt.JwtPayload;
    return decoded;
  }

  @get('/users/count')
  @response(200, {
    description: 'User model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(User) where?: Where<User>,
  ): Promise<Count> {
    return this.userRepository.count(where);
  }

  @get('/users')
  @response(200, {
    description: 'Array of User model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(User, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(User) filter?: Filter<User>,
  ): Promise<User[]> {
    return this.userRepository.find(filter);
  }

  @patch('/users')
  @response(200, {
    description: 'User PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {partial: true}),
        },
      },
    })
    user: User,
    @param.where(User) where?: Where<User>,
  ): Promise<Count> {
    return this.userRepository.updateAll(user, where);
  }

  @authenticate('jwt')
  @get('/users/{id}')
  @response(200, {
    description: 'User model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(User, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(User, {exclude: 'where'}) filter?: FilterExcludingWhere<User>
  ): Promise<User> {
    return this.userRepository.findById(id, filter);
  }

  
  @patch('/users/{id}')
  @response(204, {
    description: 'User PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {partial: true}),
        },
      },
    })
    user: User,
  ): Promise<void> {
    await this.userRepository.updateById(id, user);
  }

  @put('/users/{id}')
  @response(204, {
    description: 'User PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() user: User,
  ): Promise<void> {
    await this.userRepository.replaceById(id, user);
  }


  @authenticate('jwt')
  @del('/users/{id}')
  @response(204, {
    description: 'User DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.userRepository.deleteById(id);
  }
}
