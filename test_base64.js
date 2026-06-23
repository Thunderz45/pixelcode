const arr = new Uint8Array(1024 * 1024);
try {
  const base64String = btoa(
    arr.reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ''
    )
  );
  console.log("Success");
} catch (e) {
  console.error(e.message);
}
