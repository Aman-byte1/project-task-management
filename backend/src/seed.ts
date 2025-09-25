import { User, UserRole } from './models/User';

export async function seedAdmin() {
  try {
    const adminExists = await User.findOne({ where: { email: 'admin@example.com' } });

    if (!adminExists) {
      await User.create({
        email: 'admin@example.com',
        password: 'admin123',
        name: 'Admin User',
        role: UserRole.ADMIN
      });
      console.log('Admin user created successfully');
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
}
