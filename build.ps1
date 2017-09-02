# This file is for building and testing locally on Windows.
"#######################################"
"## How to build and test this add-on ##"
"#######################################"
""
"To work this batch file successfully, please install 7-Zip to 'C:\Program Files\7-Zip\7z.exe'"
$env:Path += ";C:\Program Files\7-Zip\"
""
"Archive 'ReFwdFormatter' Program"
$addon = "refwdformatter@masahiko.info.xpi"
$xpi = "refwdformatter-newversion.xpi"
$zip = "refwdformatter-newversion.zip"
If (Test-Path bin\$zip){
	"  removing bin\$zip"
	Remove-Item bin\$zip
	"  removed."
}
""
"  compressing src\* -> bin\$zip"
7z a .\bin\$zip .\src\*
"  compressed."
""
If (Test-Path bin\$zip){
	"  moving bin\$zip -> bin\$xpi"
	Move-Item -Path bin\$zip bin\$xpi -Force
	"  moved."
} else {
	exit
}
""
"Override-Copy 'ReFwdFormatter' Program to local system"
$a = $env:APPDATA
$b = (Get-ChildItem $a\Thunderbird\Profiles).Name
if ( [string]::IsNullOrEmpty($a) -And [string]::IsNullOrEmpty($b) ) {
	"  cloudn't detect your Thunderbird Profiles. Please install Thunderbird app and ReFwdFormatter add-on on Windows. Then, check the following the folder and file: "
	"    $a\Thunderbird\Profiles\$b\extensions\$addon"
} else {
	"  copying bin\$xpi -> $a\Thunderbird\Profiles\$b\extensions\$addon"
	Copy-Item bin\$xpi "$a\Thunderbird\Profiles\$b\extensions\$addon" -Force
	"  copied."
}
""
"Getting script options."
If ($args.Length -ne 0) {
	$mode = $args[0].ToLower()
	If ($mode -eq "-silent") {
		exit
	}
}
""
"Opening Thunderbird add-on folder..."
invoke-item "$a\Thunderbird\Profiles\$b\extensions"
"  opened."
""
"Opening src folder..."
invoke-item "src"
"  opened."
""
"Opening bin folder..."
invoke-item "bin"
"  opened."
""
""
"[Manual Install and Develop Instruction]:"
"1. Please manually Zip src folder's content (without folder itself) to bin\refwdformatter-<newversion>.xpi"
""
"2. Then update Thunderbird add-on folder's refwdformatter@masahiko.info.xpi file by bin\refwdformatter-<newversion>.xpi."
"    Or, install add-on from bin\refwdformatter-<newversion>.xpi file."
"           -> https://support.mozilla.org/en-US/kb/thunderbird-add-ons-frequently-asked-questions#w_installing-add-ons-from-within-thunderbird "
""
"3. If you would like to develop this add-on, please UnZip Thunderbird add-on folder's refwdformatter@masahiko.info.xpi file to the same folder."
"    And remove refwdformatter@masahiko.info.xpi file temporally."
""