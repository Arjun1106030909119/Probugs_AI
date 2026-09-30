const { execSync } = require('child_process');
try {
  console.log("Starting extension build...");
  execSync('powershell.exe -Command "Compress-Archive -Path extension\\* -DestinationPath probugs-extension-1.2.0.zip -Force"');
  console.log("Zip successful.");
} catch (e) {
  console.error("Error zipping:", e.message);
}
