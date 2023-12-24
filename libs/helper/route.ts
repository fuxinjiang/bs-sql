import { Emitter } from "../bs-sdk/Emitter";
import getEM from "@/orm/getEm";
import withORM from "@/orm/withORM";
import { NextApiRequest, NextApiResponse } from "next";
import { HttpException } from "./HttpException";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@/config/env";
import { User } from "@/entities/User";
import { Loaded } from "@mikro-orm/core";

export interface Route {
  get(handler: (req: NextApiRequest, res: NextApiResponse) => any): {
    auth(): void;
  };
  post(handler: (req: NextApiRequest, res: NextApiResponse) => any): {
    auth(): void;
  };
  delete(handler: (req: NextApiRequest, res: NextApiResponse) => any): {
    auth(): void;
  };
  put(handler: (req: NextApiRequest, res: NextApiResponse) => any): {
    auth(): void;
  };

  getEM(): ReturnType<typeof getEM>;
  authUser(req: NextApiRequest): Loaded<User>;
}

export function defRoute(register: (route: Route) => void) {
  const GET = new Emitter();
  const POST = new Emitter();
  const DELETE = new Emitter();
  const PUT = new Emitter();

  const emMethods = {
    GET,
    POST,
    DELETE,
    PUT,
  };

  let authMap = {
    GET: false,
    POST: false,
    DELETE: false,
    PUT: false,
  };

  const route: Route = {
    get(handler) {
      GET.on(handler);
      return {
        auth() {
          authMap.GET = true;
        },
      };
    },
    post(handler) {
      POST.on(handler);
      return {
        auth() {
          authMap.POST = true;
        },
      };
    },
    delete(handler) {
      DELETE.on(handler);
      return {
        auth() {
          authMap.DELETE = true;
        },
      };
    },
    put(handler) {
      PUT.on(handler);
      return {
        auth() {
          authMap.PUT = true;
        },
      };
    },

    getEM: getEM,

    authUser(req) {
      return (req as any).user;
    },
  };
  register(route);
  return withORM(async (req, res) => {
    const method = req.method as keyof typeof emMethods;
    const em = emMethods[method];
    if (em.size()) {
      try {
        if (authMap[method]) {
          const token = req.headers.authorization;
          if (!token) {
            throw new HttpException(401, "Unauthorized");
          }
          const { id } = jwt.verify(token, JWT_SECRET) as { id: string };
          const user = await getEM().findOne(User, { id });
          if (!user) {
            throw new HttpException(401, "Unauthorized");
          }
          (req as any).user = user;
        }
        await Promise.all(em?.emitSync(req, res));
      } catch (error) {
        if (error instanceof HttpException) {
          res.status(200).json({ code: error.code, msg: error.message });
        } else {
          console.error(error);
          res.status(500).json({ code: 500, msg: String(error) });
        }
      }
    } else {
      res.status(404).json({ code:404, msg: "Not found" });
    }
  });
}
