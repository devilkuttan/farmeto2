//router
require("dotenv").config();
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const adminlogin = require("../models/admin/adminlogin");
const cookieAuth = require("../utils/auth");
const verification = require("../models/admin/verification");
const farmerlogin = require("../models/farmer/farmerlogin");
const buyerlogin = require("../models/buyer/buyerlogin");
router.get("/login", async (req, res) => {
  try {
    if (req.cookies.admin) {
      const token = jwt.verify(req.cookies.admin, process.env.JWT_SECRET_TOKEN);
      const findId = await adminlogin.findByPk(token);

      if (findId) {
        return res.redirect(`/admin/dashboard`);
      } else {
        return res.redirect(`/admin/login`);
      }
    } else {
      const result = await adminlogin.count();

      if (result == 1) {
        return res.render("../views/admin/login", {
          emailExist: true,
          passwordError: false,
          email: "",
          password: "",
        });
      } else {
        return res.redirect("signup");
      }
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashPassword = await adminlogin.findOne({ where: { email: email } });

    if (!hashPassword) {
      return res.render("../views/admin/login", {
        emailExist: false,
        passwordError: false,
        email: email,
        password: password,
      });
    } else {
      bcrypt.compare(password, hashPassword?.dataValues?.password, (err, data) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (data) {
          const token = cookieAuth(hashPassword.dataValues.id);
          res.cookie("admin", token, {
            expires: new Date(Date.now() + 172800 * 1000),
            secure: true,
            httpOnly: true,
          });
          return res.redirect("/admin/dashboard");
        } else {
          return res.render("../views/admin/login", {
            emailExist: true,
            passwordError: true,
            email: email,
            password: password,
          });
        }
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/signup", async (req, res) => {
  try {
    const result = await adminlogin.count();
    if (result == 1) {
      return res.redirect("login");
    } else {
      return res.render("../views/admin/signup", {
        passwordError: false,
        email: "",
        password: "",
        confirm: "",
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const { email, password, confirm } = req.body;

    if (password !== confirm) {
      return res.render("../views/admin/signup", {
        emailExist: false,
        passwordError: true,
        email: email,
        password: password,
        confirm: confirm,
      });
    } else {
      bcrypt.hash(password, 12, async (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        } else {
          const data = await adminlogin.create({
            email: email,
            password: hashedPassword,
          });

          const token = cookieAuth(data.dataValues.id);
          res.cookie("admin", token, {
            expires: new Date(Date.now() + 172800 * 1000),
            secure: true,
            httpOnly: true,
          });

          return res.redirect("/admin/dashboard");
        }
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


router.get("/dashboard", async (req, res) => {
  try {
    // Check if admin cookie exists
    if (req.cookies.admin) {
      // Verify admin token
      const verify = jwt.verify(
        req.cookies.admin,
        process.env.JWT_SECRET_TOKEN
      );
      // Retrieve all verification requests
      const verificationDetails = await verification.findAll();
      // Calculate profile count
      const profileCount = verificationDetails.length;
      // Render admin dashboard with verification details and profile count
      res.render("../views/admin/dashboard", { profileDetails: verificationDetails, profileCount });

    } else {
      // If admin cookie doesn't exist, redirect to admin login
      res.redirect("/admin/login");
    }
  } catch (err) {
    // Handle error
    res.json({ err: err.message });
  }
});
router.get("/dashboard/:id/accept", async (req, res) => {
  const { id } = req.params;

  if (req.cookies.admin) {
    const verify = jwt.verify(
      req.cookies.admin,
      process.env.JWT_SECRET_TOKEN
    );
    const checkId = await adminlogin.findByPk(verify);

    if (!checkId) {
      res.clearCookie("admin");
      res.redirect("/admin/login");
    } else {
      const moveData = await verification.findByPk(id).then((data) => {
        farmerlogin.create({
          id: data.id,
          email: data.email,
          password: data.password,
          name: data.name,
          contactNumber: data.contactNumber,
          pincode: data.pincode,
          district: data.district,
          village: data.village,
          street: data.street,
          location: data.location,
          houseNo: data.houseNo,
          proof: data.proof,
        });

        data.destroy();
      });

      res.redirect("/admin/dashboard");
    }
  } else {
    res.redirect("/admin/login");
  }
});

router.get("/dashboard/:id/reject", async (req, res) => {
  const { id } = req.params;

  if (req.cookies.admin) {
    const verify = jwt.verify(
      req.cookies.admin,
      process.env.JWT_SECRET_TOKEN
    );
    const checkId = await adminlogin.findByPk(verify);

    if (!checkId) {
      res.clearCookie("admin");
      res.redirect("/admin/login");
    } else {
      const moveData = await verification.findByPk(id);

      if (moveData) {
        moveData.destroy();
      }
      res.redirect("/admin/dashboard");
    }
  } else {
    res.redirect("/admin/login");
  }
});

router.get("/dashboard/buyers", async (req, res) => {
  if (req.cookies.admin) {
    console.log("correct");
    const token = jwt.verify(req.cookies.admin, process.env.JWT_SECRET_TOKEN);
    const findId = await adminlogin.findByPk(token);

    if (!findId) {
      res.redirect(`/admin/login`);
    } else {
      const buyers = await buyerlogin.findAll({
        order: [["createdAt", "DESC"]],
      });
      res.render("../views/admin/buyers", { buyers: buyers });
    }
  } else {
    res.redirect(`/admin/login`);
  }
});
router.get("/dashboard/buyers/delete/:id", async (req, res) => {
  const { id } = req.params;
  if (req.cookies.admin) {
    console.log("correct");
    const token = jwt.verify(req.cookies.admin, process.env.JWT_SECRET_TOKEN);
    const findId = await adminlogin.findByPk(token);

    if (!findId) {
      res.redirect(`/admin/login`);
    } else {
      const findbuyer= await buyerlogin.findByPk(id);

      if (!findbuyer) {
        res.redirect("/admin/dashboard");
      } else {
        await findbuyer
          .destroy()
          .then(() => {
            res.redirect("/admin/dashboard/buyers");
          })
          .catch((err) => {
            res.json({ err: err.message });
          });
      }
    }
  } else {
    res.redirect("/admin/login");
  }
});

router.get("/dashboard/farmers", async (req, res) => {
  if (req.cookies.admin) {
    console.log("correct");
    const token = jwt.verify(req.cookies.admin, process.env.JWT_SECRET_TOKEN);
    const findId = await adminlogin.findByPk(token);

    if (!findId) {
      res.redirect(`/admin/login`);
    } else {
      const farmers = await farmerlogin.findAll({
        order: [["createdAt", "DESC"]],
      });
      res.render("../views/admin/farmers", { farmers: farmers });
    }
  } else {
    res.redirect(`/admin/login`);
  }
});

router.get("/dashboard/farmers/delete/:id", async (req, res) => {
  const { id } = req.params;
  if (req.cookies.admin) {
    console.log("correct");
    const token = jwt.verify(req.cookies.admin, process.env.JWT_SECRET_TOKEN);
    const findId = await adminlogin.findByPk(token);

    if (!findId) {
      res.redirect(`/admin/login`);
    } else {
      const findfarmer= await farmerlogin.findByPk(id);

      if (!findfarmer) {
        res.redirect("/admin/dashboard");
      } else {
        await findfarmer
          .destroy()
          .then(() => {
            res.redirect("/admin/dashboard/farmers");
          })
          .catch((err) => {
            res.json({ err: err.message });
          });
      }
    }
  } else {
    res.redirect("/admin/login");
  }
});

router.get("/dashboard/logout", (req, res) => {
  if (req.cookies.admin) {
    res.clearCookie("admin");
    res.redirect("/admin/login");
  } else {
    res.redirect("/admin/login");
  }
});

module.exports = router;
