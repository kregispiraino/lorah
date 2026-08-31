function createAuthController(authService) {
  return {
    async login(req, res, next) {
      try {
        const { email, password } = req.body || {};
        if (typeof email !== "string" || typeof password !== "string" || !email.includes("@") || password.length > 200) {
          return res.status(400).json({ error: "Informe e-mail e senha válidos." });
        }
        const user = await authService.authenticate(email, password);
        if (!user) return res.status(401).json({ error: "E-mail ou senha inválidos." });
        req.session.regenerate((error) => {
          if (error) return next(error);
          req.session.user = user;
          req.session.save((saveError) => saveError ? next(saveError) : res.json({ user }));
        });
      } catch (error) { next(error); }
    },

    me(req, res) { res.json({ user: req.session.user }); },

    logout(req, res, next) {
      req.session.destroy((error) => {
        if (error) return next(error);
        res.clearCookie("lorah.sid");
        res.status(204).end();
      });
    }
  };
}

module.exports = { createAuthController };
