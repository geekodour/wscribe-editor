let
  pkgs = import <nixpkgs> {};
  pyPackages = pkgs.python310Packages;
in
  pkgs.mkShell {
    name = "py";
    venvDir = "./.venv";
    buildInputs = with pyPackages; [ pip venvShellHook ];

    postShellHook = ''
      # allow pip to install wheels
      mkdir -p nltk_data
      unset SOURCE_DATE_EPOCH
      export NLTK_DATA=$PWD/nltk_data
      pip install git+https://github.com/suno-ai/bark.git 
      pip install nltk
      pip install wscribe
      python -m nltk.downloader "punkt"
    '';
  }
