"use client";
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
    <nav style={{ padding: "1rem", borderRight: "1px solid #ccc", width: "200px" }}>
      <ul>
        {menuItems.map((item) => (
          <li key={item.path} style={{ marginBottom: "1rem" }}>
            <Link href={item.path} passHref>
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default NavMenuBar;
