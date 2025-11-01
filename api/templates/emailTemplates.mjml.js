// const emailTemplates = {
//   /**
//    * 🧩 Account Verified (Admin / Super Admin / Sub Admin)
//    */
//   accountVerified: `
//   <mjml>
//     <mj-body background-color="#96d275ff"  font-family="Arial, sans-serif">
//       <mj-section background-color="#ffffff" border-radius="8px" padding="20px" margin="30px">
//         <mj-column>
//           <mj-text font-size="20px"  color="#000000ff"font-weight="bold">
//             Hello {{firstName}},
//           </mj-text>
//           <mj-text  color="#000000ff">
//             Your {{roleType}} account has been verified successfully.
//           </mj-text>
//           <mj-text>
//             You can now log in using your registered mobile number:
//             <strong>{{mobNo}}</strong>.
//           </mj-text>
//           <mj-divider border-color="#000000ff" />
//           <mj-text font-size="14px"  color="#000000ff">
//             Thank you,<br/>
//             <mj-text>
//             <strong> Team BazarGhorr</strong>
//           </mj-text>
//           </mj-text>
//         </mj-column>
//       </mj-section>
//     </mj-body>
//   </mjml>
//   `,

//   /**
//    * 🛒 Vendor Account Created
//    */
//   vendorCreated: `
//   <mjml>
//     <mj-body background-color="#96d275ff" font-family="Arial, sans-serif">
//       <mj-section background-color="#ffffffff" border-radius="8px" padding="20px" margin="30px">
//         <mj-column>
//           <mj-text font-size="22px" color="#000000ff" font-weight="bold">
//             Your account has been created 🎉
//           </mj-text>
//           <mj-text font-size="18px" color="#000000ff">
//             Hello {{firstName}},
//           </mj-text>
//           <mj-text color="#000000ff">
//             You can now login using your mobile number:
//           </mj-text>
//           <mj-text>
//             <strong>Mobile No:</strong> {{mobNo}}
//           </mj-text>
//           <mj-divider border-color="#000000ff" />
//           <mj-text font-size="14px" color="#000000ff">
//             You can now log in using your registered mobile number.<br/>
//             Thank you for joining us!<br/>
//             <strong> Team BazarGhorr</strong>
//           </mj-text>
//         </mj-column>
//       </mj-section>
//     </mj-body>
//   </mjml>
//   `,

//   /**
//    * 🚚 Delivery Partner Account Created
//    */
//   deliveryPartnerCreated: `
//   <mjml>
//     <mj-body background-color="#96d275ff"  font-family="Arial, sans-serif">
//       <mj-section background-color="#ffffff" border-radius="8px" padding="20px"  margin="30px">
//         <mj-column>
//           <mj-text font-size="22px"  color="#000000ff"font-weight="bold">
//             Welcome to BazarGhorr App 🚀
//           </mj-text>
//           <mj-text font-size="18px"  color="#000000ff">
//             Hello {{firstName}},
//           </mj-text>
//           <mj-text  color="#000000ff">
//             Your delivery partner account has been created successfully.
//           </mj-text>
//           <mj-text>
//             <strong>Mobile No:</strong> {{mobNo}}<br/>
//             <strong>Date of Birth:</strong> {{dob}}
//           </mj-text>
//           <mj-divider border-color="#000000ff" />
//           <mj-text font-size="14px"  color="#000000ff">
//             You can now log in using your registered mobile number.<br/>
//             Thank you for joining us!<br/>
//                 <mj-text>
//             <strong> Team BazarGhorr</strong>
//           </mj-text>
//           </mj-text>
//         </mj-column>
//       </mj-section>
//     </mj-body>
//   </mjml>
//   `,

//   /**
//    * 👤 Customer Account Created
//    */
//   customerCreated: `
//   <mjml>
//     <mj-body background-color="#96d275ff"font-family="Arial, sans-serif">
//       <mj-section background-color="#ffffff" border-radius="8px" padding="20px" margin="30px">
//         <mj-column>
//           <mj-text font-size="22px" color="#2c3e50" font-weight="bold">
//             Welcome to BazarGhorr App
//           </mj-text>
//           <mj-text font-size="18px" color="#333333">
//             Hello {{firstName}},
//           </mj-text>
//           <mj-text color="#333333">
//             Your customer account has been created by our team.
//           </mj-text>
//           <mj-text>
//             <strong>Mobile No:</strong> {{mobNo}}
//           </mj-text>
//           <mj-divider border-color="#000000ff" />
//           <mj-text font-size="14px" color="#666666">
//             You can log in anytime using your registered mobile number.<br/>
//             — {{appName || "Team BazarGhorr"}}
//           </mj-text>
//         </mj-column>
//       </mj-section>
//     </mj-body>
//   </mjml>
//   `,

//   /**
//    * 🔐 Password Reset OTP
//    */
//   passwordResetOTP: `
//   <mjml>
//     <mj-body background-color="#96d275ff"  font-family="Arial, sans-serif" >
//       <mj-section background-color="#ffffff" border-radius="8px" padding="20px" margin="30px">
//         <mj-column>
//           <mj-text font-size="20px" color="#2c3e50" font-weight="bold">
//             Hello {{firstName}},
//           </mj-text>
//           <mj-text color="#333333">
//             Your password reset OTP is:
//           </mj-text>
//           <mj-text font-size="26px" color="#e74c3c" font-weight="bold">
//             {{OTP}}
//           </mj-text>
//           <mj-text color="#333333">
//             This OTP will expire in 2 minutes.<br/>
//             If you didn't request this, please ignore this email.
//           </mj-text>
//         </mj-column>
//       </mj-section>
//     </mj-body>
//   </mjml>
//   `,

//   adminCreates: `
//       <mjml>
//         <mj-body background-color="#96d275ff" font-family="Arial, sans-serif">
//           <mj-section>
//             <mj-column>
//               <mj-text
//                 align="left"
//                 font-size="18px"
//                 font-weight="bold"
//                 color="#000000ff">
//                 Hello {{firstName}},
//               </mj-text>
//               <mj-text font-size="16px" color="#000000ff" line-height="1.6">
//                 Your admin account has been created successfully. Use the
//                 credentials below to log in:
//               </mj-text>
//               <mj-divider border-color="#000000ff"></mj-divider>
//               <mj-text font-size="16px" color="#000000ff">
//                 <strong>Email:</strong> {{email}}
//                 <br />
//                 <strong>Password:</strong> {{generatedPassword}}
//               </mj-text>

//               <mj-divider border-color="#000000ff"></mj-divider>

//               <mj-text font-size="15px" color="#000000ff">
//                 Please change your password after your first login.
//               </mj-text>

//               <mj-text
//                 font-size="14px"
//                 color="#000000ff"
//                 align="center"
//                 padding-top="20px"
//               >
//                 Team BazarGhorr
//               </mj-text>
//             </mj-column>
//           </mj-section>
//         </mj-body>
//       </mjml>
//     `,
// };

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
  <mj-section background-color="#ffffff" border-radius="10px" padding="32px 24px" css-class="card">
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
  accountVerified: `
 <mjml>
 <mj-body background-color="#f5f6f7">
 <mj-section background-color="#ffffff" border-radius="10px" padding="32px 24px">
 <mj-column>
 <mj-text font-family="Inter, Arial, sans-serif" font-size="22px" font-weight="bold" color="#2c3e50">
 Account Verified ✅
 </mj-text>
 <mj-text font-size="16px" color="#333333">
            Hello {{firstName}},
            </mj-text>
            <mj-text>
            Your <strong>{{roleType}}</strong> account has been verified successfully.
            </mj-text>
            <mj-text>
            You can now log in using your registered mobile number: <strong>{{mobNo}}</strong>.
            </mj-text>
            <mj-divider border-color="#eaeaea" />
            <mj-text font-size="14px" color="#555">
            Thank you,<br/><strong>Team BazarGhorr</strong>
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
           <mj-body background-color="#f5f6f7">
           <mj-section background-color="#ffffff" border-radius="10px" padding="32px 24px">
           <mj-column>
           <mj-text font-size="22px" font-weight="bold" color="#2c3e50">
           Welcome to BazarGhorr 🎉
           </mj-text>
           <mj-text>
           Hello {{firstName}}, your vendor account has been successfully created.
           </mj-text>
           <mj-text>
           <strong>Mobile No:</strong> {{mobNo}}
           </mj-text>
           <mj-divider border-color="#eaeaea" />
           <mj-text font-size="14px" color="#555">
           You can now log in using your registered mobile number.<br/>
           <strong>Team BazarGhorr</strong>
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
    <mj-body background-color="#f5f6f7">
    <mj-section background-color="#ffffff" border-radius="10px" padding="32px 24px">
        <mj-column>
        <mj-text font-size="22px" font-weight="bold" color="#2c3e50">
        Welcome to BazarGhorr 🚀
        </mj-text>
        <mj-text>Hello {{firstName}},</mj-text>
        <mj-text>Your delivery partner account has been created successfully.</mj-text>
        <mj-text>
        <strong>Mobile No:</strong> {{mobNo}}<br/>
        <strong>Date of Birth:</strong> {{dob}}
        </mj-text>
        <mj-divider border-color="#eaeaea" />
        <mj-text font-size="14px" color="#555">
        You can now log in using your registered mobile number.<br/>
        <strong>Team BazarGhorr</strong>
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
       <mj-body background-color="#f5f6f7">
       <mj-section background-color="#ffffff" border-radius="10px" padding="32px 24px">
       <mj-column>
       <mj-text font-size="22px" font-weight="bold" color="#2c3e50">
       Welcome to BazarGhorr 💚
       </mj-text>
       <mj-text>
       Hello {{firstName}}, your customer account has been created successfully.
       </mj-text>
       <mj-text>
       <strong>Mobile No:</strong> {{mobNo}}
       </mj-text>
       <mj-divider border-color="#eaeaea" />
       <mj-text font-size="14px" color="#555">
       You can log in anytime using your registered mobile number.<br/>
       <strong>{{appName || "Team BazarGhorr"}}</strong>
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
      <mj-body background-color="#f5f6f7">
      <mj-section background-color="#ffffff" border-radius="10px" padding="32px 24px">
      <mj-column>
      <mj-text font-size="22px" font-weight="bold" color="#2c3e50">
      Password Reset Request
      </mj-text>
      <mj-text>Hello {{firstName}},</mj-text>
      <mj-text>Your password reset OTP is:</mj-text>
      <mj-text font-size="28px" font-weight="bold" color="#e74c3c">
      {{OTP}}
      </mj-text>
      <mj-text color="#555">
      This OTP will expire in 2 minutes.<br/>If you didn't request this, please ignore this email.
      </mj-text>
      </mj-column>
      </mj-section>
      </mj-body>
      </mjml>
      `,

  /**
   * 🧑‍💼 Admin Created
   */
  adminCreates: `
     <mjml>
     <mj-body background-color="#f5f6f7">
     <mj-section background-color="#ffffff" border-radius="10px" padding="32px 24px">
     <mj-column>
     <mj-text font-size="22px" font-weight="bold" color="#2c3e50">
     Admin Account Created
     </mj-text>
     <mj-text>Hello {{firstName}},</mj-text>
     <mj-text>
     Your admin account has been created successfully. Use the credentials below to log in:
     </mj-text>
     <mj-text>
     <strong>Email:</strong> {{email}}<br/>
     <strong>Password:</strong> {{generatedPassword}}
     </mj-text>
     <mj-divider border-color="#eaeaea" />
     <mj-text font-size="14px" color="#555">
     Please change your password after your first login.<br/>
     <strong>Team BazarGhorr</strong>
     </mj-text>
     </mj-column>
     </mj-section>
     </mj-body>
     </mjml>
     `,
};
module.exports = emailTemplates;
