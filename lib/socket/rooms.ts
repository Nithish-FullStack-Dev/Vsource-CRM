export const SOCKET_ROOMS = {
  user(userId: string): string {
    return `user:${userId}`;
  },

  branch(branchId: string): string {
    return `branch:${branchId}`;
  },

  role(roleName: string): string {
    const normalizedRole = roleName.trim().toLowerCase().replace(/\s+/g, "-");

    return `role:${normalizedRole}`;
  },
} as const;
