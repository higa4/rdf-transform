/*

Copyright 2010, Google Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

 * Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above
copyright notice, this list of conditions and the following disclaimer
in the documentation and/or other materials provided with the
distribution.
 * Neither the name of Google Inc. nor the names of its
contributors may be used to endorse or promote products derived from
this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,           
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY           
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 */

// NOTE: This is a Server-Side JavaScript
//
//   The Server-Side JavaScript processor may be a limited funtionality
//   processor, so many functions taken for granted in modern JavaScript
//   processors may not be present in this implementation.

importPackage(com.google.refine.rdf.commands);

// Client side preferences mirror Server side...
var RDFTransformPrefs = {
	"Verbosity"   : 0,
	"ExportLimit" : 10737418,
	"DebugMode"   : false
}

var logger = Packages.org.slf4j.LoggerFactory.getLogger("RDFT:Controller");

var RefineBase = Packages.com.google.refine;

function registerClientSide() {
	var ClientSideResourceManager = RefineBase.ClientSideResourceManager;

	//
    //  Client-side Resources...
    // ------------------------------------------------------------

    /*
	 *  Client-side Javascript...
	 */
	ClientSideResourceManager
	.addPaths(
		"project/scripts",
		module,
		// Script files to inject into /project page...
		[	"scripts/rdf-transform-menubar-extensions.js", // must be first: language and menu load
			"scripts/rdf-transform.js",
			"scripts/rdf-transform-resource.js",
			"scripts/rdf-transform-ui-link.js",
			"scripts/rdf-transform-ui-node.js",
			"scripts/rdf-transform-vocab-manager.js",
			"scripts/rdf-transform-prefixes-manager.js",
			"scripts/rdf-transform-prefix-adder.js",
			"scripts/rdf-transform-suggest-term.js",
			"scripts/rdf-transform-export-template.js",
			"scripts/rdf-transform-common.js",
			"scripts/rdf-data-table-view.js",
			//"scripts/externals/jquery.form.min.js",
		]
	);

    /*
	 *  Client-side CSS...
	 */
	ClientSideResourceManager
	.addPaths(
		"project/styles",
		module,
		// Style files to inject into /project page...
		[	"styles/rdf-transform-dialog.css",
			"styles/flyout.css",
		]
	);
}

function registerServerSide() {
	var RefineServlet = RefineBase.RefineServlet;

	var RDFTBase = RefineBase.rdf;
	var RDFTBaseApp = RDFTBase.app;
	var RDFTBaseCmd = RDFTBase.command;

    //
    //  Server-side Resources...
    // ------------------------------------------------------------

	/*
	 *  Server-side Context Initialization...
	 *    Tests a simple attempt to mimic dependency injection.
	 */
	var appContext = new RDFTBaseApp.ApplicationContext();

	/*
     *  Server-side Ajax Commands...
	 *    Each registration calls the class' init() method.
     */
	var strExportRDFTemplate = "export-rdf-template";
	var strSaveRDFTransform = "save-rdf-transform";
	RefineServlet.registerCommand( module, "initialize",             new RDFTBaseApp.InitializationCommand(appContext) );
	RefineServlet.registerCommand( module, strExportRDFTemplate,     new RDFTBaseCmd.ExportTemplateCommand(appContext) );
	RefineServlet.registerCommand( module, strSaveRDFTransform,      new RDFTBaseCmd.SaveRDFTransformCommand(appContext) );
    RefineServlet.registerCommand( module, "save-baseIRI",           new RDFTBaseCmd.SaveBaseIRICommand(appContext) );
    RefineServlet.registerCommand( module, "preview-rdf",            new RDFTBaseCmd.PreviewRDFCommand() );
    RefineServlet.registerCommand( module, "preview-rdf-expression", new RDFTBaseCmd.PreviewRDFExpressionCommand() );
    RefineServlet.registerCommand( module, "validate-iri",           new RDFTBaseCmd.ValidateIRICommand() );
	// Vocabs commands
    RefineServlet.registerCommand( module, "get-default-prefixes",   new RDFTBaseCmd.GetDefaultPrefixesCommand(appContext) );
    RefineServlet.registerCommand( module, "add-prefix",             new RDFTBaseCmd.AddPrefixCommand(appContext) );
    RefineServlet.registerCommand( module, "upload-file-add-prefix", new RDFTBaseCmd.AddPrefixFromFileCommand(appContext) );
    RefineServlet.registerCommand( module, "refresh-prefix",         new RDFTBaseCmd.RefreshPrefixCommand(appContext) );
    RefineServlet.registerCommand( module, "remove-prefix",          new RDFTBaseCmd.RemovePrefixCommand(appContext) );
    RefineServlet.registerCommand( module, "save-prefixes",          new RDFTBaseCmd.SavePrefixesCommand(appContext) );
    RefineServlet.registerCommand( module, "suggest-term",           new RDFTBaseCmd.SuggestTermCommand(appContext) );
    RefineServlet.registerCommand( module, "get-prefix-cc-iri",      new RDFTBaseCmd.SuggestPrefixIRICommand(appContext) );
	// Others:
	//   CodeResponse - Standard Response Class for Commands
	//   RDFTransformCommand - Abstract RDF Command Class

    /*
     *  Server-side Custom Change Class...
     */
	var strRefineBase = "com.google.refine";
	RefineServlet.registerClassMapping(
	  	// Non-existent name--we are adding, not renaming...
		strRefineBase + ".model.changes.DataExtensionChange",
		// Added Change Class name...
		strRefineBase + ".rdf.operation.RDFTransformChange"
	);
	RefineServlet.cacheClass(RDFTBase.operation.RDFTransformChange);

    /*
     *  Server-side Operations...
     */
    RefineBase.operations.OperationRegistry
	.registerOperation( module, strExportRDFTemplate, RDFTBase.operation.ExportTemplateOperation );
    RefineBase.operations.OperationRegistry
	.registerOperation( module, strSaveRDFTransform, RDFTBase.operation.SaveRDFTransformOperation );

    /*
     *  Server-side GREL Functions and Binders...
     */
	var RDFTGrelFuncReg = RefineBase.grel.ControlFunctionRegistry;
    RDFTGrelFuncReg.registerFunction( "toIRIString", new RDFTBase.expr.func.str.toIRIString() );
    RDFTGrelFuncReg.registerFunction( "toStrippedLiteral", new RDFTBase.expr.func.str.toStrippedLiteral() );

	RefineBase.expr.ExpressionUtils
	.registerBinder( new RDFTBase.expr.RDFBinder(appContext) );

    /*
     *  Server-side Exporters...
     */
    var RefineExpReg = RefineBase.exporters.ExporterRegistry;
    var RDFTExp = RDFTBase.exporter.RDFExporter;
	var RDFFormat = org.eclipse.rdf4j.rio.RDFFormat;

    RefineExpReg.registerExporter( "RDF",         new RDFTExp(appContext, RDFFormat.RDFXML) );
    RefineExpReg.registerExporter( "N-Triples",   new RDFTExp(appContext, RDFFormat.NTRIPLES) );
    RefineExpReg.registerExporter( "Turtle",      new RDFTExp(appContext, RDFFormat.TURTLE) );
    RefineExpReg.registerExporter( "Turtle-star", new RDFTExp(appContext, RDFFormat.TURTLESTAR) );
	RefineExpReg.registerExporter( "N3",          new RDFTExp(appContext, RDFFormat.N3) );
	RefineExpReg.registerExporter( "TriX",        new RDFTExp(appContext, RDFFormat.TRIX) );
	RefineExpReg.registerExporter( "TriG",        new RDFTExp(appContext, RDFFormat.TRIG) );
	RefineExpReg.registerExporter( "TriG-star",   new RDFTExp(appContext, RDFFormat.TRIGSTAR) );
	RefineExpReg.registerExporter( "BinaryRDF",   new RDFTExp(appContext, RDFFormat.BINARY) );
	RefineExpReg.registerExporter( "N-Quads",     new RDFTExp(appContext, RDFFormat.NQUADS) );
	RefineExpReg.registerExporter( "JSON-LD",     new RDFTExp(appContext, RDFFormat.JSONLD) );
	RefineExpReg.registerExporter( "NDJSON-LD",   new RDFTExp(appContext, RDFFormat.NDJSONLD) );
	RefineExpReg.registerExporter( "RDF/JSON",    new RDFTExp(appContext, RDFFormat.RDFJSON) );
	RefineExpReg.registerExporter( "RDFa",        new RDFTExp(appContext, RDFFormat.RDFA) );
	RefineExpReg.registerExporter( "HDT",         new RDFTExp(appContext, RDFFormat.HDT) );

    /*
     *  Server-side Overlay Models - Attach an RDFTransform object to the project...
     */
    RefineBase.model.Project
	.registerOverlayModel(RDFTBase.RDFTransform.EXTENSION, RDFTBase.RDFTransform);
}

function processPreferences() {
	/*
	 *  Process OpenRefine Preference Store...
	 *
	 *  NOTE: We have limited use for these preferences in this Server-Side
	 *  controller.js code.  We use this opportunity to simple check and report
	 *  on the preferences related to this extension.
	 */
	var prefStore = RefineBase.ProjectManager.singleton.getPreferenceStore();
	if (prefStore != null) {
		// Verbosity...
		var prefVerbosity = prefStore.get('RDFTransform.verbose');
		if (prefVerbosity == null) {
			prefVerbosity = prefStore.get('verbose');
		}
		if (prefVerbosity != null) {
			var iVerbosity = parseInt(prefVerbosity);
			if (iVerbosity != NaN) {
				RDFTransformPrefs["Verbosity"] = iVerbosity;
			}
		}
		// Export Limit...
		var prefExportLimit = prefStore.get('RDFTransform.exportLimit');
		if (prefExportLimit != null) {
			var iExportLimit = parseInt(prefExportLimit);
			if (iExportLimit != NaN) {
				RDFTransformPrefs["ExportLimit"] = iExportLimit;
			}
		}
		// Debug...
		var prefDebug = prefStore.get('RDFTransform.debug');
		if (prefDebug == null) {
			prefDebug = prefStore.get('debug');
		}
		if (prefDebug != null) {
			var bDebug = (prefDebug.toLowerCase() == 'true');
			logger.info("DebugMode Test: " + prefDebug + " " + bDebug);
			RDFTransformPrefs["DebugMode"] = bDebug;
		}

		//
		// Output RDFTranform Preferences...
		//
		// NOTE: This really sucks because this server-side JavaScript is extremely limited!!!
		//		1. Looping structure don't exist!
		//		2. JSON object does not exist, so no stringify()!
		// In other words, we can't automate the processing of the RDFTransformPrefs list, but
		// must call out each pref by key explicitly.
		var strPrefs = "Preferences: { ";
		var strPref;
		strPref = "Verbosity";
		strPrefs += strPref + " : " + RDFTransformPrefs[strPref].toString() + " , ";
		strPref = "ExportLimit";
		strPrefs += strPref + " : " + RDFTransformPrefs[strPref].toString() + " , ";
		strPref = "DebugMode";
		strPrefs += strPref + " : " + RDFTransformPrefs[strPref].toString() + " }";
		logger.info(strPrefs);
	}
	else {
		logger.info("Preferences not yet loaded!");
	}
}

/*
 * Initialization Function for RDF Transform Extension.
 */
function init() {
	logger.info("Initializing RDFTransform Extension...");
	logger.info("  Ext Mount Point: " + module.getMountPoint() );

	registerClientSide();
	registerServerSide();
	processPreferences();
}

/*
 * Process Function for external command requests.
 */
function process(path, request, response) {
	
    var method = request.getMethod();

	if ( RDFTransformPrefs.DebugMode ) {
		logger.info('DEBUG: Receiving request by ' + method + ' for "' + path + '"\n' +
					'       Request: ' + request);
	}

	//
	// Analyze path and handle this request...
	//

	if (path == "" || path == "/") {
		var context = {};
		//
		// Here's how to pass things into the .vt templates:
		//   context.someList = ["Superior","Michigan","Huron","Erie","Ontario"];
		//   context.someString = "foo";
		//   context.someInt = RefineBase.sampleExtension.SampleUtil.stringArrayLength(context.someList);
		//
		context.RDFTransform_protocol = request.url.protocol;
		context.RDFTransform_host = request.url.host;
		context.RDFTransform_path = request.url.pathname;
		context.RDFTransform_search = request.url.search;
		context.RDFTransform_href = request.url.href;

		send(request, response, "index.vt", context);
    }
}

function send(request, response, template, context) {
	var encoding = "UTF-8";
	var html = "text/html";

	butterfly.sendTextFromTemplate(request, response, context, template, encoding, html);
}
