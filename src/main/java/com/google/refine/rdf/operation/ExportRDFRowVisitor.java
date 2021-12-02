package com.google.refine.rdf.operation;

import java.util.List;

import com.google.refine.rdf.RDFTransform;
import com.google.refine.rdf.ResourceNode;
import com.google.refine.rdf.Util;

import com.google.refine.model.Project;
import com.google.refine.model.Row;

import org.eclipse.rdf4j.common.net.ParsedIRI;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryException;
import org.eclipse.rdf4j.rio.RDFHandlerException;
import org.eclipse.rdf4j.rio.RDFWriter;

public class ExportRDFRowVisitor extends RDFRowVisitor {

    public ExportRDFRowVisitor(RDFTransform theTransform, RDFWriter theWriter) {
        super(theTransform, theWriter);
    }

    public boolean visit(Project theProject, int iRowIndex, Row theRow) {
        try {
            ParsedIRI baseIRI = this.getRDFTransform().getBaseIRI();
            RepositoryConnection theConnection = this.getModel().getConnection();
            ValueFactory theFactory = theConnection.getValueFactory();
            List<ResourceNode> listRoots = this.getRDFTransform().getRoots();
            for ( ResourceNode root : listRoots ) {
                root.createStatements(baseIRI, theFactory, theConnection, theProject,
                                        theRow, iRowIndex);
                //
                // Flush Statements
                //
                // Write and clear a discrete set of statements from the repository connection
                // as the transformed statements use in-memory resources until flushed to disk.
                // Otherwise, large files would use excessive memory!
                //
                if ( theConnection.size() > Util.getExportLimit() ) {
                    this.flushStatements();
                }
            }

            // Flush any remaining statements...
            this.flushStatements();
        }
        catch (RepositoryException ex) {
            throw new RuntimeException(ex);
        }
        catch (RDFHandlerException ex) {
            throw new RuntimeException(ex);
        }

        return false;
    }
}
