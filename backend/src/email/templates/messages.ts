import type { Language } from '../../generated/prisma/client.js';

type Template = { subject: string; heading: string; body: string; cta: string; footer: string };

export const EMAIL_MESSAGES: Record<
  'verifyEmail' | 'resetPassword' | 'changeEmail' | 'passwordChanged',
  Record<Language, Template>
> = {
  verifyEmail: {
    en: {
      subject: 'Verify your Kardify email address',
      heading: 'Welcome to Kardify, {name}!',
      body: 'Please confirm your email address to start creating digital business cards. This link expires in 24 hours.',
      cta: 'Verify email',
      footer: "If you didn't create a Kardify account, you can safely ignore this email.",
    },
    ar: {
      subject: 'تأكيد بريدك الإلكتروني في Kardify',
      heading: 'مرحبًا بك في Kardify، {name}!',
      body: 'يرجى تأكيد بريدك الإلكتروني للبدء في إنشاء بطاقات الأعمال الرقمية. تنتهي صلاحية هذا الرابط خلال 24 ساعة.',
      cta: 'تأكيد البريد الإلكتروني',
      footer: 'إذا لم تقم بإنشاء حساب في Kardify، يمكنك تجاهل هذه الرسالة.',
    },
  },
  resetPassword: {
    en: {
      subject: 'Reset your Kardify password',
      heading: 'Reset your password',
      body: 'Hi {name}, we received a request to reset your password. This link expires in 1 hour and can only be used once.',
      cta: 'Reset password',
      footer: "If you didn't request a password reset, you can ignore this email. Your password won't change.",
    },
    ar: {
      subject: 'إعادة تعيين كلمة مرور Kardify',
      heading: 'إعادة تعيين كلمة المرور',
      body: 'مرحبًا {name}، تلقينا طلبًا لإعادة تعيين كلمة المرور. تنتهي صلاحية هذا الرابط خلال ساعة واحدة ويمكن استخدامه مرة واحدة فقط.',
      cta: 'إعادة تعيين كلمة المرور',
      footer: 'إذا لم تطلب إعادة التعيين، تجاهل هذه الرسالة ولن تتغير كلمة المرور.',
    },
  },
  changeEmail: {
    en: {
      subject: 'Confirm your new email address',
      heading: 'Confirm your new email',
      body: 'Hi {name}, confirm this address to finish updating your Kardify account email. This link expires in 24 hours.',
      cta: 'Confirm email',
      footer: "If you didn't request this change, ignore this email.",
    },
    ar: {
      subject: 'تأكيد بريدك الإلكتروني الجديد',
      heading: 'تأكيد البريد الإلكتروني الجديد',
      body: 'مرحبًا {name}، أكّد هذا العنوان لإكمال تحديث البريد الإلكتروني لحسابك في Kardify. تنتهي صلاحية الرابط خلال 24 ساعة.',
      cta: 'تأكيد البريد الإلكتروني',
      footer: 'إذا لم تطلب هذا التغيير، تجاهل هذه الرسالة.',
    },
  },
  passwordChanged: {
    en: {
      subject: 'Your Kardify password was changed',
      heading: 'Password changed',
      body: 'Hi {name}, your password was just changed and other sessions were signed out. If this wasn\'t you, reset your password immediately.',
      cta: 'Sign in',
      footer: 'Kardify security notification.',
    },
    ar: {
      subject: 'تم تغيير كلمة مرور Kardify',
      heading: 'تم تغيير كلمة المرور',
      body: 'مرحبًا {name}، تم تغيير كلمة المرور للتو وتم تسجيل الخروج من الجلسات الأخرى. إذا لم تكن أنت، أعد تعيين كلمة المرور فورًا.',
      cta: 'تسجيل الدخول',
      footer: 'إشعار أمان من Kardify.',
    },
  },
};
