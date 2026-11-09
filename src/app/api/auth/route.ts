import { NextRequest, NextResponse } from 'next/server';
import {
  getUsers,
  getUserById,
  authenticateUser,
  changeUserPassword,
  updateUserPassword,
  updateUserProfile,
  getStaffUsers,
  registerStaffUser
} from '@/lib/services';
import { createSessionToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const staffOnly = searchParams.get('staff_only') === 'true';

    if (staffOnly) {
      const staffList = getStaffUsers();
      return NextResponse.json({ success: true, staff: staffList });
    }

    const rawUsers = getUsers();
    // Exclude password from public list
    const users = rawUsers.map(u => {
      const { password, ...rest } = u;
      return rest;
    });
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Strict Login
    if (body.action === 'login') {
      const { identifier, password } = body;
      if (!identifier || !identifier.trim()) {
        return NextResponse.json({ success: false, error: 'يرجى إدخال رقم الهاتف أو البريد الإلكتروني' }, { status: 400 });
      }
      if (!password || !password.trim()) {
        return NextResponse.json({ success: false, error: 'يرجى إدخال كلمة المرور' }, { status: 400 });
      }

      const user = authenticateUser(identifier, password);
      if (!user) {
        return NextResponse.json({ 
          success: false, 
          error: 'بيانات الدخول غير صحيحة: تحقق من رقم الهاتف/الإيميل وكلمة المرور' 
        }, { status: 401 });
      }

      const token = createSessionToken(user.id, user.role, user.name);
      const { password: _, ...safeUser } = user;

      const response = NextResponse.json({ success: true, user: safeUser, token });
      response.cookies.set('aquapro_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });

      return response;
    }

    // 2. Switch User (Instant Role Switch for seamless testing & development)
    if (body.action === 'switch-user') {
      const { userId } = body;
      if (!userId) {
        return NextResponse.json({ success: false, error: 'معرف المستخدم مطلوب' }, { status: 400 });
      }

      const user = getUserById(userId);
      if (!user) {
        return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 });
      }

      const token = createSessionToken(user.id, user.role, user.name);
      const { password: _, ...safeUser } = user;

      const response = NextResponse.json({ success: true, user: safeUser, token });
      response.cookies.set('aquapro_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });

      return response;
    }

    // 3. Register Staff User (Strictly staff: HR, Coach, Assistant)
    if (body.action === 'register-staff') {
      const { name, phone, email, role, title, password } = body;

      if (!name || !name.trim()) {
        return NextResponse.json({ success: false, error: 'اسم الموظف مطلوب' }, { status: 400 });
      }
      if (!phone || !phone.trim()) {
        return NextResponse.json({ success: false, error: 'رقم الهاتف مطلوب' }, { status: 400 });
      }
      if (!email || !email.trim()) {
        return NextResponse.json({ success: false, error: 'البريد الإلكتروني مطلوب' }, { status: 400 });
      }
      if (!role || !['hr', 'coach', 'assistant'].includes(role)) {
        return NextResponse.json({ success: false, error: 'الدور الوظيفي يجب أن يكون: HR، مدرب، أو مساعد' }, { status: 400 });
      }

      const newUser = registerStaffUser({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        role,
        title,
        password,
      });

      const token = createSessionToken(newUser.id, newUser.role, newUser.name);
      const { password: _, ...safeUser } = newUser;

      const response = NextResponse.json({
        success: true,
        user: safeUser,
        token,
        message: 'تم تسجيل الموظف بنجاح في المنظومة'
      });
      response.cookies.set('aquapro_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });

      return response;
    }

    // Logout
    if (body.action === 'logout') {
      const response = NextResponse.json({ success: true });
      response.cookies.delete('aquapro_session');
      return response;
    }

    // Change Password by user
    if (body.action === 'change-password') {
      const { userId, oldPassword, newPassword } = body;
      if (!userId || !oldPassword || !newPassword) {
        return NextResponse.json({ success: false, error: 'جميع الحقول مطلوبة' }, { status: 400 });
      }

      const result = changeUserPassword(userId, oldPassword, newPassword);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
    }

    // Update User Profile (Name, Phone, Title, Email, Avatar)
    if (body.action === 'update-profile') {
      const { userId, name, phone, title, email, avatar } = body;
      if (!userId) {
        return NextResponse.json({ success: false, error: 'معرف المستخدم مطلوب' }, { status: 400 });
      }

      const result = updateUserProfile(userId, { name, phone, title, email, avatar });
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      const { password: _, ...safeUser } = result.user!;
      return NextResponse.json({ 
        success: true, 
        user: safeUser, 
        message: 'تم تحديث البيانات بنجاح' 
      });
    }

    // Reset Password by Admin
    if (body.action === 'reset-password') {
      const { targetUserId, newPassword } = body;
      if (!targetUserId || !newPassword || newPassword.length < 4) {
        return NextResponse.json({ success: false, error: 'كلمة المرور يجب ألا تقل عن 4 خانات' }, { status: 400 });
      }
      const updated = updateUserPassword(targetUserId, newPassword);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'تعذر تعديل كلمة المرور' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'تم إعادة تعيين كلمة المرور بنجاح' });
    }

    return NextResponse.json({ success: false, error: 'طلب غير مصرح به' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
