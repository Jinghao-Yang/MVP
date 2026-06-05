module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: '循环依赖检测',
      from: {
        path: 'src/',
      },
      to: {
        circular: true,
      },
    },
    {
      name: 'stores-services-db-cycle',
      severity: 'error',
      comment: 'stores、services、db 之间禁止循环依赖',
      from: {
        path: 'src/(stores|services|db)/',
      },
      to: {
        path: 'src/(stores|services|db)/',
        circular: true,
      },
    },
  ],
  options: {
    moduleSystems: ['es6'],
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    doNotFollow: ['node_modules'],
    exclude: ['node_modules'],
  },
};
