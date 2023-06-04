import nodemailer from "nodemailer";
import google from "googleapis";
import dotenv from "dotenv";

if (process.env.NODE_ENV !== "PRODUCTION") {
  dotenv.config({
    path: "configs/.env",
  });
}

const oAuth2client = new google.Auth.OAuth2Client(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET
);

// oAuth2client.generateAuthUrl({
//   // 'online' (default) or 'offline' (gets refresh_token)
//   access_type: "offline",
//   /** Pass in the scopes array defined above.
//    * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
//   // Enable incremental authorization. Recommended as a best practice.
//   include_granted_scopes: true,
// });

oAuth2client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});
const sendMail = async (options) => {
  const accessToken = await oAuth2client.getAccessToken();
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: "huynhnhathao0609@gmail.com",
      pass: process.env.PASS,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
      accessToken: accessToken,
    },
  });

  const mailOptions = {
    from: "huynhnhathao0609@gmail.com",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  await transporter.sendMail(mailOptions);
};

export default sendMail;
