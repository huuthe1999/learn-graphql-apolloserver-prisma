import { Field, Int, InterfaceType, ObjectType } from 'type-graphql'

import { Post, User } from '@generated'

@InterfaceType()
abstract class IMutationResponse {
  @Field(_type => Int)
  status!: number

  @Field()
  isSuccess!: boolean

  @Field({ nullable: true })
  message?: string
}

@ObjectType()
export class FieldError {
  @Field()
  field!: string

  @Field()
  message!: string
}

@ObjectType({ implements: IMutationResponse })
export class PostMutationResponse implements IMutationResponse {
  @Field(_type => Int)
  status!: number

  @Field()
  isSuccess!: boolean

  @Field()
  message?: string

  @Field({ nullable: true })
  post?: Post

  @Field(_type => [FieldError], { nullable: true })
  errors?: FieldError[]
}

@ObjectType({ implements: IMutationResponse })
export class UserMutationResponse implements IMutationResponse {
  @Field(_type => Int)
  status!: number

  @Field()
  isSuccess!: boolean

  @Field()
  message?: string

  @Field({ nullable: true })
  user?: User

  @Field(_type => [FieldError], { nullable: true })
  errors?: FieldError[]
}
