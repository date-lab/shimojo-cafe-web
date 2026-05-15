import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminLogin } from "../../api";

export function AdminLogin() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await adminLogin(user.trim(), pass);
      navigate("/admin/items", { replace: true });
    } catch {
      setError("ユーザー名またはパスワードが違います");
    }
  };

  return (
    <div className="page admin-login">
      <header className="topbar">
        <h1>管理ログイン</h1>
      </header>
      <form className="admin-form" onSubmit={(e) => void onSubmit(e)}>
        <label>
          ユーザー名
          <input
            type="text"
            name="username"
            autoComplete="username"
            inputMode="text"
            spellCheck={false}
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="input"
          />
        </label>
        <label>
          パスワード
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="input"
          />
        </label>
        {error && <p className="banner error">{error}</p>}
        <button type="submit" className="btn primary large">
          ログイン
        </button>
      </form>
      <Link className="btn secondary" to="/">
        購入画面へ
      </Link>
    </div>
  );
}
