clang --target=wasm32 -O2 -mbulk-memory -c lib.c
wasm-ld --no-entry --export-all --lto-O2 --allow-undefined --import-memory lib.o -o lib.wasm
