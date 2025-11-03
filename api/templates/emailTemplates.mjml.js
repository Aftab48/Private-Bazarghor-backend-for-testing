const emailTemplates = {
  /**
   * 🌿 Base Layout (Used Internally)
   */
  baseLayout: (content, title = "", accent = "#96d275") => `
    <mjml>
      <mj-head>
        <mj-preview>${title}</mj-preview>
        <mj-attributes>
          <mj-text font-family="Inter, Arial, sans-serif" color="#333" line-height="1.6" />
          <mj-section padding="0px" />
          <mj-column padding="0px" />
          <mj-divider border-color="#eaeaea" border-width="1px" />
        </mj-attributes>
      </mj-head>
      <mj-body background-color="#f5f6f7">
        <mj-section background-color="#ffffff" border-radius="10px" padding="32px 24px">
          <mj-column>
            <mj-text align="center" font-size="22px" color="#000" font-weight="bold" padding-bottom="12px">
              ${title}
            </mj-text>
            ${content}
          </mj-column>
        </mj-section>

        <mj-section padding-top="16px">
          <mj-column>
            <mj-text font-size="13px" color="#7f8c8d" align="center">
              ©️ ${new Date().getFullYear()} BazarGhorr. All rights reserved.
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `,

  /**
   * 🧩 Account Verified
   */
  accountVerified: ({ firstName, roleType, mobNo }) =>
    emailTemplates.baseLayout(
      `
      <mj-text font-size="16px" color="#333">
        Hello ${firstName},
      </mj-text>
      <mj-text>
        Your <strong>${roleType}</strong> account has been verified successfully.
      </mj-text>
      <mj-text>
        You can now log in using your registered mobile number: <strong>${mobNo}</strong>.
      </mj-text>
      <mj-divider border-color="#eaeaea" />
      <mj-text font-size="14px" color="#555">
        Thank you,<br/><strong>Team BazarGhorr</strong>
      </mj-text>
    `,
      "Account Verified ✅"
    ),

  /**
   * 🛒 Vendor Account Created
   */
  vendorCreated: ({ firstName, mobNo }) =>
    emailTemplates.baseLayout(
      `
      <mj-text>
        Hello ${firstName}, your vendor account has been successfully created.
      </mj-text>
      <mj-text><strong>Mobile No:</strong> ${mobNo}</mj-text>
      <mj-divider border-color="#eaeaea" />
      <mj-text font-size="14px" color="#555">
        You can now log in using your registered mobile number.<br/>
        <strong>Team BazarGhorr</strong>
      </mj-text>
    `,
      "Welcome to BazarGhorr 🎉"
    ),

  /**
   * 🚚 Delivery Partner Account Created
   */
  deliveryPartnerCreated: ({ firstName, mobNo, dob }) =>
    emailTemplates.baseLayout(
      `
      <mj-text>Hello ${firstName},</mj-text>
      <mj-text>
        Your delivery partner account has been created successfully.
      </mj-text>
      <mj-text>
        <strong>Mobile No:</strong> ${mobNo}<br/>
        <strong>Date of Birth:</strong> ${dob}
      </mj-text>
      <mj-divider border-color="#eaeaea" />
      <mj-text font-size="14px" color="#555">
        You can now log in using your registered mobile number.<br/>
        <strong>Team BazarGhorr</strong>
      </mj-text>
    `,
      "Welcome to BazarGhorr 🚀"
    ),

  /**
   * 👤 Customer Account Created
   */
  customerCreated: ({ firstName, mobNo, appName = "Team BazarGhorr" }) =>
    emailTemplates.baseLayout(
      `
      <mj-text>
        Hello ${firstName}, your customer account has been created successfully.
      </mj-text>
      <mj-text><strong>Mobile No:</strong> ${mobNo}</mj-text>
      <mj-divider border-color="#eaeaea" />
      <mj-text font-size="14px" color="#555">
        You can log in anytime using your registered mobile number.<br/>
        <strong>${appName}</strong>
      </mj-text>
    `,
      "Welcome to BazarGhorr 💚"
    ),

  /**
   * 🔐 Password Reset OTP
   */
  passwordResetOTP: ({ firstName, OTP }) =>
    emailTemplates.baseLayout(
      `
      <mj-text>Hello ${firstName},</mj-text>
      <mj-text>Your password reset OTP is:</mj-text>
      <mj-text font-size="28px" font-weight="bold" color="#e74c3c">
        ${OTP}
      </mj-text>
      <mj-text color="#555">
        This OTP will expire in 2 minutes.<br/>
        If you didn't request this, please ignore this email.
      </mj-text>
    `,
      "Password Reset Request"
    ),

  /**
   * 🧑‍💼 Admin Created
   */
  adminCreates: ({ firstName, email, generatedPassword }) =>
    emailTemplates.baseLayout(
      `
      <mj-text>Hello ${firstName},</mj-text>
      <mj-text>
        Your admin account has been created successfully. Use the credentials below to log in:
      </mj-text>
      <mj-text>
        <strong>Email:</strong> ${email}<br/>
        <strong>Password:</strong> ${generatedPassword}
      </mj-text>
      <mj-divider border-color="#eaeaea" />
      <mj-text font-size="14px" color="#555">
        Please change your password after your first login.<br/>
        <strong>Team BazarGhorr</strong>
      </mj-text>
    `,
      "Admin Account Created"
    ),
};

module.exports = emailTemplates;
