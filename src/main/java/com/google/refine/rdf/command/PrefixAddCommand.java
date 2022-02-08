package com.google.refine.rdf.command;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.refine.rdf.RDFTransform;
import com.google.refine.rdf.model.Util;

public class PrefixAddCommand extends RDFTransformCommand {

	public PrefixAddCommand() {
		super();
	}

	@Override
	public void doPost(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		if ( ! this.hasValidCSRFToken(request) ) {
			PrefixAddCommand.respondCSRFError(response);
			return;
		}
		String strPrefix       = request.getParameter(Util.gstrPrefix).strip();
        String strNamespace    = request.getParameter(Util.gstrNamespace).strip();
        String strProjectID    = request.getParameter(Util.gstrProject);
        String strFetchOption  = request.getParameter("fetch").strip();

		if ( strFetchOption.equals("web") ) {
			String strFetchURL = request.getParameter("fetch-url");
			if (strFetchURL == null || strFetchOption.isEmpty()) {
				strFetchURL = strNamespace;
			}
			try {
				RDFTransform.getGlobalContext().
					getVocabularySearcher().
						importAndIndexVocabulary(
							strPrefix, strNamespace, strFetchURL, strProjectID);
			}
			catch (Exception ex) { // VocabularyImportException | IOException
				PrefixAddCommand.respondJSON(response, CodeResponse.error);
				return;
        	}
		}

        this.getRDFTransform(request).addPrefix(strPrefix, strNamespace);

		PrefixAddCommand.respondJSON(response, CodeResponse.ok);
    }
}