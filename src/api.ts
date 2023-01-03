import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { useState, useCallback } from "react";

type ApiMethod = "GET" | "POST" | "PUT" | "DELETE";

class Api<REQ, RES> {
  public readonly url: string;
  public readonly method: ApiMethod;

  constructor(url: string, method: ApiMethod) {
    this.url = url;
    this.method = method;
  }
}

interface HttpRequest<REQ> {
  body: REQ;
}

interface HttpResponse<RES> {
  body: RES;
  statusCode: number;
}

export const createApi = <REQ extends {}, RES extends {}>(url: string, method: ApiMethod) => {
  return new Api<REQ, RES>(url, method);
};

export const handleApi = <REQ, RES>(
  api: Api<REQ, RES>,
  callback: (request: HttpRequest<REQ>) => Promise<HttpResponse<RES>>
): [Api<any, any>, NextApiHandler<any>] => {
  return [
    api,
    async (req: NextApiRequest, res: NextApiResponse) => {
      if (req.url !== "/api" + api.url) throw new Error();
      if (req.method !== api.method) throw new Error();
      if (req.headers["content-type"] !== "application/json") throw new Error();
      const { body, statusCode } = await callback({ body: req.body });
      res.status(statusCode).json(body);
    },
  ];
};

export const routeApi = (handlersWithApi: [Api<any, any>, NextApiHandler<any>][]) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const handler = handlersWithApi.find(([api]) => req.method === api.method)?.[1];
    if (handler === undefined) {
      res.status(501).end();
    } else {
      await handler(req, res);
    }
  };
};

export const useFetcher = () => {
  const [isFetching, setIsFetching] = useState(false);

  const wrappedFetch = useCallback(
    <REQ extends REQ_A, RES extends RES_A, REQ_A, RES_A>(
      api: Api<REQ_A, RES_A>,
      request: REQ
    ): Promise<HttpResponse<RES>> => {
      if (isFetching) throw new Error();
      setIsFetching(true);
      return (async () => {
        const response = await fetch("/api" + api.url, {
          method: api.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });
        const statusCode = response.status;
        const body = await response.json();
        setIsFetching(false);
        return { statusCode, body };
      })();
    },
    [isFetching]
  );

  return [isFetching, wrappedFetch] as const;
};
