#!/bin/sh
set -eu

test -f app/assets/logo_new.png
file app/assets/logo_new.png | grep -q 'PNG image data'
test "$(shasum -a 256 app/assets/logo_new.png | awk '{print $1}')" = "6853b3b2d6db66c4aa9425b9497acda7e8cd84f36727eef4e12120ae4f83de1c"
