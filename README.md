# CACHEBUSTER-CLI


cachebuster-cli is a command line tool to generate hashed filenames along with a manifest.json file

## Options

```
-h, --help               output usage information
-V, --version            output the version number
-d, --dir <dir>          Input directory
-o, --output <dir>       Output directory
-p, --public-path <dir>  Public path for assets in manifest
-e, --ext <extensions>   List of extensions to be parsed
-a, --assets <file>      file in which to write manifest, by default manifest.json
--all                    Parse all extensions in input directory
```

## Example

With minimum Options:
```
cachebuster -d public/css -o public/css/dist -e css
```

With multiple extensions
```
cachebuster -d public -o public/dist -e css,js
```

With custom publicPath in case you use aws or a cdn
```
cachebuster -d public -o tmp -p htps://s3.amazonaws.com/bucket -e css
```
