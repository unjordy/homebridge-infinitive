{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs-16_x

    # keep this line if you use bash
    pkgs.bashInteractive
  ];
}
