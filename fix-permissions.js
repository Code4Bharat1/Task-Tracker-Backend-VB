import mongoose from 'mongoose';
import Company from './src/modules/companies/companies.model.js';

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/task-tracker')
  .then(async () => {
    const company = await Company.findOne();
    if (!company) {
      console.log('No company found');
      process.exit(0);
    }
    
    const defaultPermissions = {
      users: { create: true, read: true, update: true, delete: false },
      projects: { create: true, read: true, update: true, delete: false },
      tasks: { create: true, read: true, update: true, delete: false },
      dailyLogs: { create: true, read: true, update: true, delete: false },
      bugs: { create: true, read: true, update: true, delete: false },
      reports: { create: true, read: true, update: true, delete: false },
      ktDocuments: { create: true, read: true, update: true, delete: false },
      leaderboard: { create: false, read: true, update: false, delete: false },
      activityLogs: { create: false, read: true, update: false, delete: false }
    };
    
    company.rolePermissions = {
      department_head: defaultPermissions,
      employee: defaultPermissions
    };
    
    await company.save();
    console.log('Company permissions updated successfully');
    console.log(JSON.stringify(company.rolePermissions, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
