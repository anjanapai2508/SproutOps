#!/bin/sh
set -eu

test -f app/assets/logo_new.png
file app/assets/logo_new.png | grep -q 'PNG image data'
