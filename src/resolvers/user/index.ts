import { Query, Resolver } from 'type-graphql'

@Resolver()
export class UserResolver {
  @Query()
  hello(): string {
    return 'hello'
  }
}
