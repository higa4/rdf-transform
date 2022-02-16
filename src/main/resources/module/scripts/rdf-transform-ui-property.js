/*
 *  CLASS RDFTransformUIProperty
 *
 *  The UI property manager for the alignment dialog
 */
class RDFTransformUIProperty {
    #dialog;
    #property;
    #options;
    #nodeuiSubject;
    #nodeuiObject;

    #tr;
    #tdMain;
    #tdToggle;
    #tdDetails
    #tableDetails;

    #collapsedDetailDiv;
    #expandedDetailDiv;

    static #nodeObjectDefault = {};
    static {
        this.#nodeObjectDefault.valueType = {};
        this.#nodeObjectDefault.valueType.type = "literal";
        this.#nodeObjectDefault.valueSource = {};
        this.#nodeObjectDefault.valueSource.source = RDFTransform.gstrValueSource;
    }

    constructor(theDialog, theProperty, theOptions, theSubjectNodeUI, theObjectNodeUI = null) {
        this.#dialog = theDialog;
        this.#property = theProperty; // ...contains prefix, localPart, and nodeObject (a Transform Node)
        this.#options = theOptions;
        this.#nodeuiSubject = theSubjectNodeUI;
        this.#nodeuiObject = theObjectNodeUI;

        //
        // Make sure an Object node exists for the property...
        //
        //      Properties will always have Object nodes, even if a default.
        //

        if (this.#nodeuiObject === null) {
            // If the property's Object node is missing...
            if ( this.#property.nodeObject === null) {
                // ...set to the default.  This will skip the Object node Property Mappings processing... 
                this.#property.nodeObject = cloneDeep(RDFTransformUIProperty.#nodeObjectDefault);
            }

            var options = {};
            options.expanded = false; // ...no presumed Object node Property Mappings to process.

            // Check for Property Mappings...
            if ("propertyMappings" in this.#property.nodeObject &&
                this.#property.nodeObject.propertyMappings !== null &&
                this.#property.nodeObject.propertyMappings.length > 0)
            {
                // We need to process Object node Property Mappings...
                options.expanded = true;
            }

            // Get a Node UI containing the Object node...
            this.#nodeuiObject = new RDFTransformUINode(
                this.#dialog,
                this.#property.nodeObject,
                false,
                null, // ...if needed, process and set properties later.  Otherwise, done!
                options
            );

            // Do we need to process Object node Property Mappings? Yes...
            if (options.expanded) {
                // Get the related Property UIs...
                var theProperties = [];
                for (const thePropertyBase of this.#property.nodeObject.propertyMappings) {
                    // Process the property for display...
                    var propertyUI = RDFTransformUIProperty.getTransformImport(theDialog, thePropertyBase, this.#nodeuiObject)
                    if (propertyUI !== null) {
                        theProperties.push(propertyUI);
                    }
                }
                // ...and set the Property UIs for the Node UI...
                this.#nodeuiObject.setPropertyUIs(theProperties);
            }

        }
        // In either case (existing or generated Node UI), make sure we have an Object node in the Property...
        if ( this.#property.nodeObject === null) {
            // ...from the Node UI...
            this.#property.nodeObject = this.#nodeuiObject.getNode();
        }
    }

    getProperty() {
        return this.#property;
    }

    processView(theTable) {
        this.#tr = theTable.insertRow();
        this.#tdMain  = this.#tr.insertCell(0);
        this.#tdToggle  = this.#tr.insertCell(1);
        this.#tdDetails = this.#tr.insertCell(2);
        this.#tableDetails = null;

        var imgExpand =
            $('<img />')
            .attr("src", this.#options.expanded ? "images/expanded.png" : "images/collapsed.png")
            .click(
                (evt) => {
                    this.#options.expanded = !this.#options.expanded;
                    $(evt.currentTarget)
                    .attr("src", this.#options.expanded ? "images/expanded.png" : "images/collapsed.png");
                    this.show();
                }
            );

        this.#collapsedDetailDiv =
            $('<div></div>')
            .addClass("padded")
            .html("...");
        this.#expandedDetailDiv =
            $('<div></div>')
            .addClass("rdf-transform-detail-container");

        $(this.#tdMain)
            .addClass("rdf-transform-property-main")
            .attr("width", "250")
            .addClass("padded");
        $(this.#tdToggle)
            .addClass("rdf-transform-property-toggle")
            .attr("width", "3%")
            .addClass("padded")
            .append(imgExpand);
        $(this.#tdDetails)
            .addClass("rdf-transform-property-details")
            .attr("width", "62%")
            .append(this.#collapsedDetailDiv)
            .append(this.#expandedDetailDiv);

        this.#render();

        this.#renderDetails(); // ...one time only

        this.show();
    }

    #render() {
        this.#renderMain();
        if ( this.#isExpandable() ) {
            this.#showExpandable();
        }
        else {
            this.#hideExpandable();
        }
    }

    #renderMain() {
        var imgClose = $('<img />')
            .attr("title", $.i18n('rdft-dialog/remove-property'))
            .attr("src", "images/close.png")
            .css("cursor", "pointer")
            .click(
                () => {
                    setTimeout(
                        () => {
                            //this.#tr.parentNode.removeChild(this.#tr);
                            this.#tr.remove(); // ...first
                            this.#nodeuiSubject.removeProperty(this); // ...second, for view update
                        },
                        100
                    );
                }
            );
        var imgArrowStart = $('<img />').attr("src", "images/arrow-start.png");
        var imgArrowEnd = $('<img />').attr("src", "images/arrow-end.png");
        var ahrefProperty = $('<a href="javascript:{}"></a>')
            .addClass("rdf-transform-property")
            .html(
                RDFTransformCommon.shortenResource(
                    this.#getTypeName(this.#property)
                )
            )
            .click( (evt) => { this.#editProperty(evt.target); } );


        $(this.#tdMain)
            .empty()
            .append(imgClose)
            .append(imgArrowStart)
            .append(ahrefProperty)
            .append(imgArrowEnd);
    }

    #renderDetails() {
        if (this.#tableDetails) {
            this.#tableDetails.remove();
        }
        this.#tableDetails =
            $('<table></table>')
            .addClass("rdf-transform-details-table-layout");
        this.#expandedDetailDiv.append(this.#tableDetails);

        if (this.#nodeuiObject !== null) {
            this.#nodeuiObject.processView(this.#tableDetails[0]);
        }
    }

    show() {
        if (this.#options.expanded) {
            this.#collapsedDetailDiv.hide();
            this.#expandedDetailDiv.show();
        }
        else {
            this.#collapsedDetailDiv.show();
            this.#expandedDetailDiv.hide();
        }
    }

    #isExpandable() {
        return ( this.#nodeuiObject.hasProperties() );
    }

    #showExpandable() {
        $(this.#tdToggle).show();
        $(this.#tdDetails).show();
    }

    #hideExpandable() {
        $(this.#tdToggle).hide();
        $(this.#tdDetails).hide();
    }

    #getTypeName(theProperty) {
        if (! theProperty ) {
            return "<ERROR: No Property!>";
        }
        if ("prefix" in theProperty && theProperty.prefix !== null) {
            return theProperty.prefix + ":" + theProperty.localPart;
        }
        else if ("localPart" in theProperty && theProperty.localPart !== null) {
            return theProperty.localPart;
        }
        else {
            return "Property?";
        }
    }

    #editProperty(element) {
        var theDialog =
            new RDFTransformResourceDialog(
                element, 'property', theProject.id, this.#dialog,
                (theProperty) => { this.#editPropertyInfo(theProperty); }
            )
        theDialog.show();
    }

    #editPropertyInfo(theProperty) {
        this.#property.prefix    = theProperty.prefix;
        this.#property.localPart = theProperty.localPart;
        this.#render();
        this.#dialog.updatePreview();
    }

    getTransformExport() {
        var theProperty = null;
        if ("localPart" in this.#property && this.#property.localPart !== null)
        {
            theProperty = {};

            if ("prefix" in this.#property && this.#property.prefix !== null) {
                theProperty.prefix = this.#property.prefix;
            }

            // For properties, "iri" valueType is implied, so the following is NOT needed:
            //theProperty.valueType = {};
            //theProperty.valueType.type = "iri";

            // TODO: Currently, all properties are "constant".  Change to allow
            //      column with expression.
            theProperty.valueSource = {};
            theProperty.valueSource.source = "constant";
            theProperty.valueSource.constant = this.#property.localPart;

            if (this.#nodeuiObject !== null) {
                var nodeObjectJSON = this.#nodeuiObject.getTransformExport();
                if (nodeObjectJSON !== null) {
                    theProperty.objectMappings = [];
                    theProperty.objectMappings.push(nodeObjectJSON);
                }
            }
        }

        return theProperty;
    }

    static getTransformImport(theDialog, theProperty, theSubjectNodeUI) {
        property = {};
        property.prefix = theProperty.prefix;
        // TODO: Currently, all properties are "constant".  Change to allow
        //      column with expression.
        property.localPart = theProperty.valueSource.constant;
        property.nodeObject = null; // ...process and set Object node later

        var theObjectNodeUI = null;
        if ("objectMappings" in theProperty &&
            theProperty.objectMappings !== null &&
            theProperty.objectMappings.length > 0)
        {
            // Process the node for display...
            // TODO: Currently, a property contains at most one Object node.  Change to allow
            //      multiple Objects.
            theObjectNodeUI = RDFTransformUINode.getTransformImport(theDialog, theProperty.objectMappings[0]);
        }

        //
        // Set up the Property UI with the existing Object Node UI...
        //
        var propertyUI = new RDFTransformUIProperty(
            theDialog, // dialog
            property,
            { expanded: true },
            theSubjectNodeUI,
            theObjectNodeUI
        );

        return propertyUI;
    }
}
