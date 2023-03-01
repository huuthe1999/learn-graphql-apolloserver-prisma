import { Field, Int, InterfaceType, ObjectType, registerEnumType } from 'type-graphql'

import { User } from '@generated'

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

export enum TypeError {
  INPUT = 1,
  SERVER = 2
}

registerEnumType(TypeError, {
  name: 'TypeError' // this one is mandatory
})

@ObjectType({ implements: IMutationResponse })
export class UserMutationResponse implements IMutationResponse {
  @Field(_type => Int)
  status!: number

  @Field()
  isSuccess!: boolean

  @Field()
  message?: string

  @Field(_type => TypeError, { nullable: true })
  typeError?: TypeError //1: Validated Input ; 2:Server error

  @Field({ nullable: true })
  user?: User

  @Field(_type => [FieldError], { nullable: true })
  errors?: FieldError[]
}
