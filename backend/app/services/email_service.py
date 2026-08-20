from __future__ import annotations

import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formataddr
from urllib.parse import urlencode

from app.core.config import settings


class EmailServiceError(Exception):
    """Raised when application email cannot be sent."""


class EmailService:
    def __init__(self) -> None:
        self.host = self._required_setting(
            settings.smtp_host,
            "SMTP_HOST",
        )
        self.port = int(settings.smtp_port)
        self.username = self._required_setting(
            settings.smtp_username,
            "SMTP_USERNAME",
        )
        self.password = self._required_setting(
            settings.smtp_password,
            "SMTP_PASSWORD",
        )
        self.from_email = self._required_setting(
            settings.smtp_from_email,
            "SMTP_FROM_EMAIL",
        )
        self.from_name = (
            settings.smtp_from_name.strip()
            if settings.smtp_from_name
            else "MALX"
        )
        self.use_starttls = bool(
            settings.smtp_use_starttls
        )

    def send_password_reset(
        self,
        *,
        recipient_email: str,
        reset_token: str,
    ) -> None:
        recipient = recipient_email.strip().lower()
        token = reset_token.strip()

        if not recipient:
            raise ValueError(
                "recipient_email is required."
            )

        if not token:
            raise ValueError(
                "reset_token is required."
            )

        reset_url = self._build_reset_url(token)

        message = EmailMessage()
        message["Subject"] = "Reset your MALX password"
        message["From"] = formataddr(
            (
                self.from_name,
                self.from_email,
            )
        )
        message["To"] = recipient

        message.set_content(
            "\n".join(
                [
                    "MALX Password Reset",
                    "",
                    "We received a request to reset your password.",
                    "",
                    f"Reset your password: {reset_url}",
                    "",
                    (
                        "This link expires in "
                        f"{settings.password_reset_expire_minutes} minutes."
                    ),
                    "",
                    (
                        "If you did not request this change, "
                        "you can ignore this email."
                    ),
                ]
            )
        )

        message.add_alternative(
            self._build_html(reset_url),
            subtype="html",
        )

        try:
            with smtplib.SMTP(
                self.host,
                self.port,
                timeout=15,
            ) as smtp:
                smtp.ehlo()

                if self.use_starttls:
                    context = ssl.create_default_context()
                    smtp.starttls(context=context)
                    smtp.ehlo()

                smtp.login(
                    self.username,
                    self.password,
                )

                smtp.send_message(message)

        except (
            smtplib.SMTPException,
            OSError,
        ) as exc:
            raise EmailServiceError(
                "Unable to send password reset email."
            ) from exc

    @staticmethod
    def _required_setting(
        value: str | None,
        name: str,
    ) -> str:
        if value is None:
            raise EmailServiceError(
                f"{name} is not configured."
            )

        normalized = value.strip()

        if not normalized:
            raise EmailServiceError(
                f"{name} is not configured."
            )

        return normalized

    @staticmethod
    def _build_reset_url(
        token: str,
    ) -> str:
        base_url = (
            settings.frontend_base_url
            .strip()
            .rstrip("/")
        )

        query = urlencode(
            {
                "token": token,
            }
        )

        return (
            f"{base_url}/reset-password?"
            f"{query}"
        )

    @staticmethod
    def _build_html(
        reset_url: str,
    ) -> str:
        expire_minutes = (
            settings.password_reset_expire_minutes
        )

        return f"""\
<!doctype html>
<html>
<body style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
  <div style="max-width:560px;margin:auto;background:#ffffff;padding:32px;border-radius:12px;">
    <h2 style="margin-top:0;">Reset your MALX password</h2>

    <p>We received a request to reset your password.</p>

    <p style="margin:28px 0;">
      <a
        href="{reset_url}"
        style="background:#111827;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;"
      >
        Reset password
      </a>
    </p>

    <p>
      This link expires in {expire_minutes} minutes.
    </p>

    <p style="color:#6b7280;font-size:14px;">
      If you did not request a password reset, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
"""


email_service = EmailService
