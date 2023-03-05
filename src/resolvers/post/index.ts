import { Arg, Authorized, Ctx, Mutation, Resolver, UseMiddleware } from 'type-graphql'

import { MyContext, PostMutationResponse } from '@types'

import { PostCreateInput, applyResolversEnhanceMap } from '@generated'

applyResolversEnhanceMap({
  Post: {
    _all: [
      UseMiddleware(({ info }, next) => {
        console.log(`Query "${info.fieldName}" accessed`)

        return next()
      })
    ],
    createOnePost: [Authorized()]
  }
})

@Resolver()
export class PostResolver {
  @Mutation(_return => PostMutationResponse)
  async createNewPost(
    @Arg('data')
    newPostData: PostCreateInput,
    @Ctx() { prisma, req }: MyContext
  ): Promise<PostMutationResponse> {
    if (!req.session.userId || req.session.userId !== newPostData.author.connect?.id)
      return {
        isSuccess: false,
        status: 401,
        message: 'Unauthenticated'
      }

    try {
      const newPost = await prisma.post.create({
        data: {
          ...newPostData
        }
      })

      return {
        isSuccess: true,
        status: 200,
        post: newPost,
        message: 'Create post successful'
      }
    } catch (error) {
      return {
        isSuccess: false,
        status: 500,
        message: 'Post not found'
      }
    }
  }
}
