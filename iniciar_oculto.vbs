Set WshShell = CreateObject("WScript.Shell")
' Inicia o backend Python oculto
WshShell.Run "cmd.exe /c python main.py", 0, False

' Muda para a pasta frontend e inicia o Node oculto
WshShell.CurrentDirectory = WshShell.CurrentDirectory & "\frontend"
WshShell.Run "cmd.exe /c npm run dev", 0, False

Set WshShell = Nothing
