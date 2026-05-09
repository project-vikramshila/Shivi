export const getSystemStatus = () => {
  return {
    status: 'ready',
    platform: process.platform,
    architecture: process.arch,
  };
};
