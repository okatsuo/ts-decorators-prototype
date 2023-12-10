import 'reflect-metadata'
import express from 'express'

type Router = { method: Methods, path: string, handlerName: symbol | string }
type Methods = 'get' | 'post'

const controllers: any[] = []

const Controller = (basePath: string): ClassDecorator => (target) => {
  Reflect.defineMetadata('basePath', basePath, target)
  controllers.push(target)
}

const method = (method: Methods) => (path = '/'): MethodDecorator => (target, propertyKey) => {
  const controllerClass = target.constructor;
  const routers: Router[] =
    Reflect.hasMetadata('routers', controllerClass) ? Reflect.getMetadata('routers', controllerClass) : []
  routers.push({ method, path, handlerName: propertyKey })
  Reflect.defineMetadata('routers', routers, controllerClass)
}

const Get = method('get')
const Post = method('post')

@Controller('/users')
export class User {
  private users: Array<{ name: string }> = [
    {
      name: 'user1'
    },
    {
      name: 'user2'
    },
    {
      name: 'user3'
    }
  ]

  @Post()
  register({ name }: { name: string }): any {
    this.users.push({ name })
    return { name }
  }

  @Get()
  list(): any {
    return this.users
  }

  @Get('/:name')
  listByName({ name }: { name: string }): any {
    return this.users.find((user) => user.name.toLowerCase() === name.toLowerCase()) ?? {}
  }
}

const app = express()
app.use(express.json())
app.get('/', (req, res) => res.json({ msg: 'Running!' }))

controllers.forEach((controller) => {
  console.log(Reflect.getMetadata('basePath', controller))
  console.log(Reflect.getMetadata('routers', controller))

  const instance = new controller()
  const basePath = Reflect.getMetadata('basePath', controller)
  const routers: Router[] = Reflect.getMetadata('routers', controller)
  routers.forEach(({ handlerName, method, path }) => {
    app[method](basePath + path, (req, res) => {
      const response = instance[handlerName]({ ...req.body, ...req.params, ...req.query })
      return res.json(response)
    })
  })

})

const port = process.env.PORT || 3000
app.listen(3000, () => console.log(`Server running at http://localhost:${port}`))