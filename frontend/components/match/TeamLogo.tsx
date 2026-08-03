"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  teamId: number;
  teamName: string;
  size?: number;
};

export default function TeamLogo({
  teamId,
  teamName,
  size = 96,
}: Props) {
  const [src, setSrc] = useState(`/teams/${teamId}.png`);

  return (
    <Image
      src={src}
      alt={teamName}
      width={size}
      height={size}
      className="h-auto w-auto object-contain"
      onError={() => setSrc("/placeholders/team.png")}
      priority
    />
  );
}