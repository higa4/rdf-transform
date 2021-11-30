package com.google.refine.rdf.operation;

import java.util.List;

import com.google.refine.rdf.ResourceNode;
import com.google.refine.rdf.Util;
import com.google.refine.rdf.RDFTransform;

import com.google.refine.model.Project;
import com.google.refine.model.Record;

import org.eclipse.rdf4j.common.net.ParsedIRI;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryException;
import org.eclipse.rdf4j.rio.RDFHandlerException;
import org.eclipse.rdf4j.rio.RDFWriter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class PreviewRDFRecordVisitor extends RDFRecordVisitor {
    private final static Logger logger = LoggerFactory.getLogger("RDFT:PrevRDFCmdRV");

    private int iCount = 0;

    public PreviewRDFRecordVisitor(RDFTransform theTransform, RDFWriter theWriter, int iLimit) {
        super(theTransform, theWriter);
        if (iLimit >= 0) // limit must be 0 or positive
            this.iLimit = iLimit;
    }

    public boolean visit(Project theProject, Record theRecord) {
        if ( this.iLimit > 0 && this.iCount >= this.iLimit ) {
            return true;
        }
        try {
            if ( Util.isVerbose(4) )
                logger.info("Visiting Record: " + theRecord.recordIndex + " on count: " +  this.iCount);
            ParsedIRI baseIRI = this.getRDFTransform().getBaseIRI();
            RepositoryConnection connection = this.getModel().getConnection();
            ValueFactory factory = connection.getValueFactory();
            List<ResourceNode> listRoots = this.getRDFTransform().getRoots();
            for ( ResourceNode root : listRoots ) {
                root.createStatements(baseIRI, factory, connection, theProject, theRecord );
                if ( Util.isVerbose(4) )
                    logger.info("    " +
                        "Root: " + root.getNodeName() + "(" + root.getNodeType() + ")  " +
                        "Size: " + connection.size()
                    );
            }
            this.iCount += 1;

            this.flushStatements();
        }
        catch (RepositoryException ex) {
            logger.warn("Connection Issue: ", ex);
            if ( com.google.refine.rdf.Util.isVerbose(4) ) ex.printStackTrace();
            return true;
        }
        catch (RDFHandlerException ex) {
            logger.warn("Flush Issue: ", ex);
            if ( com.google.refine.rdf.Util.isVerbose(4) ) ex.printStackTrace();
            return true;
        }

        return false;
    }
}