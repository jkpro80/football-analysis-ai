import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      password?: string;
    };

    const submittedPassword = body.password?.trim();
    const adminPassword = process.env.ADMIN_PASSWORD;
    const sessionToken = process.env.ADMIN_SESSION_TOKEN;

    if (!adminPassword || !sessionToken) {
      console.error(
        "ADMIN_PASSWORD or ADMIN_SESSION_TOKEN is missing.",
      );

      return NextResponse.json(
        {
          success: false,
          message: "إعدادات تسجيل الدخول غير مكتملة.",
        },
        { status: 500 },
      );
    }

    if (!submittedPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "يرجى إدخال كلمة المرور.",
        },
        { status: 400 },
      );
    }

    if (submittedPassword !== adminPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "كلمة المرور غير صحيحة.",
        },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "تم تسجيل الدخول بنجاح.",
    });

    response.cookies.set({
      name: "admin_session",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error("Admin login failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء تسجيل الدخول.",
      },
      { status: 500 },
    );
  }
}