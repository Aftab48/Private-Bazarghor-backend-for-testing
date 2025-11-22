const emailTemplates = {
  /**
   * 🌿 Base Layout (Used Internally)
   */
  baseLayout: (content, title = "", accent = "#96d275") => `
    <mjml>
      <mj-head>
        <mj-preview>${title}</mj-preview>
        <mj-attributes>
          <mj-text font-family="Helvetica, Arial, sans-serif" color="#333333" line-height="1.2" />
          <mj-section padding="0px" />
          <mj-column padding="0px" />
        </mj-attributes>
        <mj-style>
          .verification-code {
            background-color: #f0f0f0;
            padding: 16px 24px;
            border-radius: 6px;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 4px;
            color: #2c3e50;
            text-align: center;
            margin: 20px 0;
          }
        </mj-style>
      </mj-head>
      <mj-body background-color="#f5f5f5">
        <!-- Top Spacer -->
        <mj-section background-color="#f5f5f5" padding="32px 0 0 0">
          <mj-column></mj-column>
        </mj-section>

        <!-- Logo Header -->
        <mj-section background-color="#ffffff" padding="32px 24px 24px 24px" border-radius="8px 8px 0 0">
          <mj-column>
            <mj-image 
              src="https://i.postimg.cc/Cx6VKMjd/Frame-1984083188.png" 
              alt="BazarGhorr" 
              width="120px" 
              align="center"
              padding="0"
            />
          </mj-column>
        </mj-section>

        <!-- Divider -->
        <mj-section background-color="#ffffff" padding="0 24px">
          <mj-column>
            <mj-divider border-color="#e0e0e0" border-width="1px" padding="0" />
          </mj-column>
        </mj-section>

        <!-- Main Content -->
        <mj-section background-color="#ffffff" padding="32px 24px 48px 24px" border-radius="0 0 8px 8px">
          <mj-column>
            <mj-text font-size="24px" color="#000000" font-weight="bold" padding-bottom="20px">
              ${title}
            </mj-text>
            ${content}
          </mj-column>
        </mj-section>

        <!-- Footer -->
        <mj-section padding="24px 0 32px 0">
          <mj-column>
            <mj-text font-size="12px" color="#888888" align="center" line-height="1.5">
              BazarGhorr,India<br/>
              © ${new Date().getFullYear()} BazarGhorr. All rights reserved.
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
      <mj-text font-size="15px" color="#4a4a4a" padding-bottom="16px">
        Hello ${firstName},
      </mj-text>
      <mj-text font-size="15px" color="#4a4a4a" padding-bottom="16px">
        Your <strong>${roleType}</strong> account has been verified successfully.
      </mj-text>
      <mj-text font-size="15px" color="#4a4a4a" padding-bottom="16px">
        Your account <strong>FREE TRIAL</strong> has been activated for 15 days.
      </mj-text>
      <mj-text font-size="15px" color="#4a4a4a" padding-bottom="24px">
        You can now log in using your registered mobile number: <strong>${mobNo}</strong>
      </mj-text>
      <mj-divider border-color="#e0e0e0" border-width="1px" padding="24px 0" />
      <mj-text font-size="14px" color="#666666">
        Thank you,<br/><strong>Team BazarGhorr</strong>
      </mj-text>
    `,
      "Congrats! Your Account is Verified ✅"
    ),

  /**
   * 🛒 Vendor Account Created
   */
  vendorCreated: ({ firstName, mobNo }) =>
    emailTemplates.baseLayout(
      `
      <mj-text font-size="15px" color="#4a4a4a" padding-bottom="16px">
        Hello ${firstName},
      </mj-text>
      <mj-text font-size="15px" color="#4a4a4a" padding-bottom="16px">
        Your vendor account has been successfully created.
      </mj-text>
      <mj-text font-size="15px" color="#4a4a4a" padding-bottom="24px">
        <strong>Mobile Number:</strong> ${mobNo}
      </mj-text>
      <mj-text font-size="15px" color="#4a4a4a" padding-bottom="24px">
        You can now log in using your registered mobile number.
      </mj-text>
      <mj-divider border-color="#e0e0e0" border-width="1px" padding="24px 0" />
      <mj-text font-size="14px" color="#666666">
        Welcome aboard!<br/><strong>Team BazarGhorr</strong>
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
      <mj-text font-size="15px" color="#4a4a4a" padding-bottom="16px">
        Hello ${firstName},
      </mj-text>
      <mj-text font-size="15px" color="#4a4a4a" padding-bottom="16px">
        Your delivery partner account has been created successfully.
      </mj-text>
      <mj-text font-size="15px" color="#4a4a4a" padding-bottom="8px">
        <strong>Mobile Number:</strong> ${mobNo}
      </mj-text>
      <mj-text font-size="15px" color="#4a4a4a" padding-bottom="24px">
        <strong>Date of Birth:</strong> ${dob}
      </mj-text>
      <mj-text font-size="15px" color="#4a4a4a" padding-bottom="24px">
        You can now log in using your registered mobile number.
      </mj-text>
      <mj-divider border-color="#e0e0e0" border-width="1px" padding="24px 0" />
      <mj-text font-size="14px" color="#666666">
        Welcome to the team!<br/><strong>Team BazarGhorr</strong>
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
      <mj-text font-size="15px" color="#4a4a4a" padding-bottom="16px">
        Hello ${firstName},
      </mj-text>
      <mj-text font-size="15px" color="#4a4a4a" padding-bottom="16px">
        Your customer account has been created successfully.
      </mj-text>
      <mj-text font-size="15px" color="#4a4a4a" padding-bottom="24px">
        <strong>Mobile Number:</strong> ${mobNo}
      </mj-text>
      <mj-text font-size="15px" color="#4a4a4a" padding-bottom="24px">
        You can log in anytime using your registered mobile number.
      </mj-text>
      <mj-divider border-color="#e0e0e0" border-width="1px" padding="24px 0" />
      <mj-text font-size="14px" color="#666666">
        Happy shopping!<br/><strong>${appName}</strong>
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
      <mj-text font-size="15px" color="#4a4a4a" padding-bottom="16px">
        Hello ${firstName},
      </mj-text>
      <mj-text font-size="15px" color="#4a4a4a" padding-bottom="24px">
        You requested to reset your password. Enter the following verification code to reset your password:
      </mj-text>
      <mj-text css-class="verification-code">
        ${OTP}
      </mj-text>
      <mj-text font-size="14px" color="#888888" font-style="italic" padding-top="20px" padding-bottom="24px">
        This verification code will expire in 2 minutes.
      </mj-text>
      <mj-text font-size="15px" color="#4a4a4a" padding-bottom="24px">
        If you did not request this code, please ignore this email or contact our support team if you have concerns.
      </mj-text>
      <mj-divider border-color="#e0e0e0" border-width="1px" padding="24px 0" />
      <mj-text font-size="14px" color="#666666">
        <strong>Team BazarGhorr</strong>
      </mj-text>
    `,
      "Reset your password"
    ),

  /**
   * 🧑‍💼 Admin Created
   */
  adminCreates: ({ firstName, email, generatedPassword }) =>
    emailTemplates.baseLayout(
      `
      <mj-text font-size="15px" color="#4a4a4a" padding-bottom="16px">
        Hello ${firstName},
      </mj-text>
      <mj-text font-size="15px" color="#4a4a4a" padding-bottom="16px">
        Your admin account has been created successfully. Use the credentials below to log in:
      </mj-text>
      <mj-text font-size="15px" color="#4a4a4a" padding-bottom="8px">
        <strong>Email:</strong> ${email}
      </mj-text>
      <mj-text font-size="15px" color="#4a4a4a" padding-bottom="24px">
        <strong>Password:</strong> ${generatedPassword}
      </mj-text>
      <mj-text font-size="14px" color="#d9534f" padding-bottom="24px">
        ⚠️ Please change your password after your first login for security purposes.
      </mj-text>
      <mj-divider border-color="#e0e0e0" border-width="1px" padding="24px 0" />
      <mj-text font-size="14px" color="#666666">
        <strong>Team BazarGhorr</strong>
      </mj-text>
    `,
      "Admin Account Created"
    ),
};

module.exports = emailTemplates;
