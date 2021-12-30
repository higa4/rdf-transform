package com.google.refine.rdf.model.operation;

import java.io.IOException;
import java.io.LineNumberReader;
import java.io.Writer;
import java.util.Properties;

import com.google.refine.rdf.RDFTransform;
import com.google.refine.rdf.model.Util;
import com.fasterxml.jackson.core.JsonGenerator;

import com.google.refine.history.Change;
import com.google.refine.model.Project;
import com.google.refine.util.ParsingUtilities;
import com.google.refine.util.Pool;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class RDFTransformChange implements Change {
	private final static Logger logger = LoggerFactory.getLogger("RDFT:RDFTransChange");

    final private RDFTransform theCurrentTransform;
    private RDFTransform thePreviousTransform;

    public RDFTransformChange(RDFTransform theCurrentTransform, RDFTransform thePriorTransform) {
        this.theCurrentTransform = theCurrentTransform;
        this.thePreviousTransform = thePriorTransform;
    }

    //
    // Apply the lastest HistoryEntry...
    //
    public void apply(Project theProject) {
        synchronized (theProject) {
            // Store the currently saved transform as the previous transform...
            this.thePreviousTransform = (RDFTransform) theProject.overlayModels.get(RDFTransform.EXTENSION);
            // Replace the saved transform with the current transform...
            theProject.overlayModels.put(RDFTransform.EXTENSION, this.theCurrentTransform);
        }
    }

    //
    // Revert from the last HistoryEntry...
    //      On undo and failed save()s after an apply().
    //
    public void revert(Project theProject) {
        synchronized (theProject) {
            // If the transform is NEW (no previous), remove the saved transform (reset to no transform)...
            if (this.thePreviousTransform == null) {
                theProject.overlayModels.remove(RDFTransform.EXTENSION);
            }
            // Otherwise, replace the saved transform with the previous transform...
            else {
                theProject.overlayModels.put(RDFTransform.EXTENSION, this.thePreviousTransform);
            }
        }
    }

    //
    // Save the Change...
    //      On autosave and after an apply().
    //
    public void save(Writer theWriter, Properties theOptions) throws IOException {
        try {
            JsonGenerator jsonWriter = ParsingUtilities.mapper.getFactory().createGenerator(theWriter);

            theWriter.write("new=");
            if (this.theCurrentTransform != null) {
                this.theCurrentTransform.write(jsonWriter);
            }
            theWriter.write('\n');
            theWriter.write("old=");
            if (this.thePreviousTransform != null) {
                this.thePreviousTransform.write(jsonWriter);;
            }
            theWriter.write('\n');
            theWriter.write("/ec/\n"); // ...end of change marker

            jsonWriter.close();
        }
        catch (IOException ex) {
            logger.error("ERROR: Writing RDFTransform: ", ex);
            if ( Util.isVerbose() ) ex.printStackTrace();
        }
    }

    //
    // Load a Change...
    //      Whenever a HistoryEntry does not have its Change in memory.
    //
    static public Change load(LineNumberReader theReader, Pool thePool)
            throws Exception {
        RDFTransform transformPrevious = null;
        RDFTransform transformCurrent = null;

        String strLine;
        while ( ( ( strLine = theReader.readLine() ) != null ) && ! ( "/ec/".equals(strLine) ) ) {
            int iEqualIndex = strLine.indexOf('=');
            String strField = strLine.substring(0, iEqualIndex);
            String strValue = strLine.substring(iEqualIndex + 1);

            if ( strField.equals("new") && ! strValue.isEmpty() ) {
                transformCurrent =
                    RDFTransform.reconstruct(
                        ParsingUtilities.evaluateJsonStringToObjectNode(strValue)
                    );
            }
            else if ( strField.equals("old") && ! strValue.isEmpty() ) {
                transformPrevious =
                    RDFTransform.reconstruct(
                        ParsingUtilities.evaluateJsonStringToObjectNode(strValue)
                    );
            }
        }

        RDFTransformChange theChange = new RDFTransformChange(transformCurrent, transformPrevious);
        return theChange;
    }
}