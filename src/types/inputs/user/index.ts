import { InputType } from 'type-graphql'

import { Field } from 'type-graphql'

import { IsEmail, MinLength } from 'class-validator'

import { UserCreateInput } from '@generated'

@InputType()
export class CustomUserCreateInput extends UserCreateInput {
  @Field()
  username!: string

  @Field()
  @IsEmail()
  email!: string

  @Field()
  @MinLength(8)
  password!: string
}

@InputType()
export class UserLoginInput {
  @Field()
  username!: string

  @Field()
  password!: string
}
