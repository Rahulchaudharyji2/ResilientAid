// HACK: Mocking Prisma Client to avoid "npx prisma generate" build failures during Hackathon
// This disables the persistent database but keeps the app running.

const prismaMock = {
    user: {
        findUnique: async () => null,
        create: async () => null,
        update: async () => null
    },
    transaction: {
        findMany: async () => [], // Return empty history
        create: async () => null
    }
};

export default prismaMock as any;
