# ngGo

This is an AngularJS implementation of WGo, based on WGo version 2.3.1. All code has been
refactored to fit the Angular framework, as well as having been linted, properly commented
and generally cleaned up.

## JGF (JSON Game Format)
The ngGo suite includes a proposal for a standardized JSON file format for game records. It
builds on the original specifications of the SGF file format, but has an improved and easier
to parse and translate structure. In addition, the format has more flexibility than SGF for
saving different/new kinds of markup or other node annotations.

The ngGo suite also contains parsers to convert files from SGF to JGF and vice versa.

For the JGF specifications, please see [JGF.md](JGF.md). SGF specifications can be found [http://www.red-bean.com/sgf/](here).