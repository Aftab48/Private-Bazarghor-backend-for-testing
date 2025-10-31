// /api/templates/emailTemplates.mjml.js

const emailTemplates = {
  /**
   * 🧩 Account Verified (Admin / Super Admin / Sub Admin)
   */
  accountVerified: `
<mjml>
  <mj-body background-color="#96d275ff"  font-family="Arial, sans-serif">
    <mj-section background-color="#ffffff" border-radius="8px" padding="20px" margin="30px">
      <mj-column>
        <mj-text font-size="20px"  color="#000000ff"font-weight="bold">
          Hello {{firstName}},
        </mj-text>
        <mj-text  color="#000000ff">
          Your {{roleType}} account has been verified successfully.
        </mj-text>
        <mj-text>
          You can now log in using your registered mobile number:
          <strong>{{mobNo}}</strong>.
        </mj-text>
        <mj-divider border-color="#000000ff" />
        <mj-text font-size="14px"  color="#000000ff">
          Thank you,<br/>
           <mj-text>
          <strong> Team BazarGhorr</strong>
        </mj-text>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`,

  /**
   * 🛒 Vendor Account Created
   */
  vendorCreated: `
<mjml>
  <mj-body background-color="#96d275ff" font-family="Arial, sans-serif">
    <mj-section background-color="#ffffffff" border-radius="8px" padding="20px" margin="30px">
      <mj-column>
        <mj-text font-size="22px" color="#000000ff" font-weight="bold">
          Your account has been created 🎉
        </mj-text>
        <mj-text font-size="18px" color="#000000ff">
          Hello {{firstName}},
        </mj-text>
        <mj-text color="#000000ff">
          You can now login using your mobile number:
        </mj-text>
        <mj-text>
          <strong>Mobile No:</strong> {{mobNo}}
        </mj-text>
        <mj-divider border-color="#000000ff" />
        <mj-text font-size="14px" color="#000000ff">
          You can now log in using your registered mobile number.<br/>
          Thank you for joining us!<br/>
          <strong> Team BazarGhorr</strong>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`,

  /**
   * 🚚 Delivery Partner Account Created
   */
  deliveryPartnerCreated: `
<mjml>
  <mj-body background-color="#96d275ff"  font-family="Arial, sans-serif">
    <mj-section background-color="#ffffff" border-radius="8px" padding="20px"  margin="30px">
      <mj-column>
        <mj-text font-size="22px"  color="#000000ff"font-weight="bold">
          Welcome to BazarGhorr App 🚀
        </mj-text>
        <mj-text font-size="18px"  color="#000000ff">
          Hello {{firstName}},
        </mj-text>
        <mj-text  color="#000000ff">
          Your delivery partner account has been created successfully.
        </mj-text>
        <mj-text>
          <strong>Mobile No:</strong> {{mobNo}}<br/>
          <strong>Date of Birth:</strong> {{dob}}
        </mj-text>
        <mj-divider border-color="#000000ff" />
        <mj-text font-size="14px"  color="#000000ff">
          You can now log in using your registered mobile number.<br/>
          Thank you for joining us!<br/>
              <mj-text>
          <strong> Team BazarGhorr</strong>
        </mj-text>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`,

  /**
   * 👤 Customer Account Created
   */
  customerCreated: `
<mjml>
  <mj-body background-color="#96d275ff"font-family="Arial, sans-serif">
    <mj-section background-color="#ffffff" border-radius="8px" padding="20px" margin="30px">
      <mj-column>
        <mj-text font-size="22px" color="#2c3e50" font-weight="bold">
          Welcome to BazarGhorr App
        </mj-text>
        <mj-text font-size="18px" color="#333333">
          Hello {{firstName}},
        </mj-text>
        <mj-text color="#333333">
          Your customer account has been created by our team.
        </mj-text>
        <mj-text>
          <strong>Mobile No:</strong> {{mobNo}}
        </mj-text>
        <mj-divider border-color="#000000ff" />
        <mj-text font-size="14px" color="#666666">
          You can log in anytime using your registered mobile number.<br/>
          — {{appName || "Team BazarGhorr"}}
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`,

  /**
   * 🔐 Password Reset OTP
   */
  passwordResetOTP: `
<mjml>
  <mj-body background-color="#96d275ff"  font-family="Arial, sans-serif" >
    <mj-section background-color="#ffffff" border-radius="8px" padding="20px" margin="30px">
      <mj-column>
        <mj-text font-size="20px" color="#2c3e50" font-weight="bold">
          Hello {{firstName }},
        </mj-text>
        <mj-text color="#333333">
          Your password reset OTP is:
        </mj-text>
        <mj-text font-size="26px" color="#e74c3c" font-weight="bold">
          {{OTP}}
        </mj-text>
        <mj-text color="#333333">
          This OTP will expire in 2 minutes.<br/>
          If you didn't request this, please ignore this email.
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`,
};

module.exports = emailTemplates;
