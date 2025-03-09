import { FC } from "react";
import Link from "next/link";

type MenuItem = {
  name: string;
  path: string;
};

const menuItems: MenuItem[] = [
  { name: "Home", path: "/" },
  { name: "스카이림", path: "/skyrim" },
  { name: "Contact", path: "/contact" },
];

const NavMenuBar: FC = () => {
  return (
    <nav style={{ padding: 10, borderRight: "1px solid #ccc", width: 150 }}>
      <ul>
        {menuItems.map((item) => (
          <ol key={item.path} style={{ marginBottom: "1rem" }}>
            <Link href={item.path} passHref>
              {item.name}
            </Link>
          </ol>
        ))}
      </ul>
    </nav>
  );
};

export default NavMenuBar;
