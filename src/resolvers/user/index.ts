import { Query, Resolver } from 'type-graphql'

// Generate resolver type-graphql with prisma
@Resolver()
export class UserResolver {
  @Query((_returns) => String)
  async hello() {
    return 'Hello world'
  }

  // @Mutation(() => User)
  // async register(@Arg('username') username :string) {
  //   return
  // }
}
